/**
 * ==============================================================================
 * BUSBUDDY SMAN 5 SURABAYA - TAMPILAN PETA & PENANDA (js/map/map-view.js)
 * ==============================================================================
 */

const MapView = {
    map: null,
    schoolMarker: null,
    friendMarkersLayer: L.layerGroup(),
    transportMarkersLayer: L.layerGroup(),
    showTransport: true,

    // Inisialisasi peta Leaflet & CartoDB basemap
    init() {
        this.map = L.map('map', { zoomControl: false }).setView([SEKOLAH_DATA.lat, SEKOLAH_DATA.lng], 15);
        L.control.zoom({ position: 'topright' }).addTo(this.map);

        const CARTO_API_KEY = "cb1_3mqf_1_77dcd4e692f4205e0f8d5032";
        const cartoUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}&v=2`;

        L.tileLayer(cartoUrl, {
            maxZoom: 19,
            subdomains: 'abcd',
            attribution: '© OpenStreetMap & CARTO'
        }).addTo(this.map);

        this.friendMarkersLayer.addTo(this.map);
        this.transportMarkersLayer.addTo(this.map);

        this.renderSchool();
        this.renderTransport();

        // Klik peta untuk memilih lokasi penjemputan manual
        this.map.on('click', (e) => {
            if (NavigationModule.isPickingLocation) {
                NavigationModule.setUserLocation(e.latlng.lat, e.latlng.lng, 'Manual (Klik di Peta)');
                NavigationModule.isPickingLocation = false;
                this.map.getContainer().style.cursor = '';
                App.showToast("📍 Lokasi jemput Anda berhasil diatur!");
            }
        });

        // Hubungkan referensi silang MapManager
        if (window.MapManager) {
            MapManager.map = this.map;
            MapManager.friendMarkersLayer = this.friendMarkersLayer;
            MapManager.transportMarkersLayer = this.transportMarkersLayer;
        }
    },

    // 1. Penanda Sekolah
    renderSchool() {
        const schoolIcon = L.divIcon({
            className: 'custom-pin',
            html: '<div class="marker-pin marker-school">🏫</div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

        this.schoolMarker = L.marker([SEKOLAH_DATA.lat, SEKOLAH_DATA.lng], { icon: schoolIcon })
            .addTo(this.map)
            .bindPopup(`
                <div style="font-size:13px; line-height:1.4;">
                    <b style="color:#d97706; font-size:14px;">🏫 ${SEKOLAH_DATA.nama}</b><br>
                    <span style="color:#64748b;">${SEKOLAH_DATA.alamat}</span><br>
                    <hr style="margin:6px 0; border:0; border-top:1px solid #e2e8f0;">
                    ⏰ <b>Jam Masuk:</b> ${SEKOLAH_DATA.jamMasuk}<br>
                    ⚠️ <b>Batas Aman:</b> ${SEKOLAH_DATA.toleransiKeterlambatan}
                </div>
            `);
    },

    // 2. Penanda Siswa di Peta
    renderFriends(studentsList) {
        this.friendMarkersLayer.clearLayers();

        (studentsList || []).forEach(student => {
            const icon = L.divIcon({
                className: 'custom-pin',
                html: `<div class="marker-pin marker-passenger">🎒</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            let infoJarak = '';
            if (NavigationModule.userCoords) {
                const dist = NavigationModule.getDistanceKm(
                    NavigationModule.userCoords[0], NavigationModule.userCoords[1],
                    student.lat, student.lng
                );
                infoJarak = `📏 Jarak: <b>${dist.toFixed(1)} km</b><br>`;
            }

            const marker = L.marker([student.lat, student.lng], { icon: icon });
            marker.bindPopup(`
                <div style="font-size:12px; min-width:200px; line-height:1.5;">
                    <div style="margin-bottom:6px;">
                        <b style="font-size:13px; color:#1e293b;">${student.nama}</b><br>
                        <span style="color:#64748b;">Kelas: ${student.kelas}</span>
                    </div>
                    <div style="margin-top:6px;">
                        📍 <b>Area:</b> ${student.area || '-'}<br>
                        🛣️ <b>Rute:</b> ${student.rutePerjalanan || '-'}<br>
                        ${infoJarak}
                    </div>
                    <div style="margin-top:8px; display:flex; gap:6px;">
                        <button onclick="App.offerRideTo('${student.id}')" style="flex:1; background:#10b981; color:white; border:none; padding:6px 8px; border-radius:6px; font-weight:600; cursor:pointer; font-size:11px;">
                            🚗 Ajak Berangkat
                        </button>
                        <button onclick="App.requestRide('${student.id}')" style="flex:1; background:#0284c7; color:white; border:none; padding:6px 8px; border-radius:6px; font-weight:600; cursor:pointer; font-size:11px;">
                            🙋 Minta Bareng
                        </button>
                        <button onclick="MapManager.routeToDestination(${student.lat}, ${student.lng}, '${student.nama}')" style="background:#1e3a8a; color:white; border:none; padding:6px 8px; border-radius:6px; font-weight:600; cursor:pointer; font-size:11px;">
                            🗺️ Rute
                        </button>
                    </div>
                </div>
            `);

            this.friendMarkersLayer.addLayer(marker);
        });
    },

    // 3. Penanda Transportasi Umum
    renderTransport() {
        this.transportMarkersLayer.clearLayers();
        TRANSPORTASI_UMUM.forEach(tp => {
            const emoji = tp.tipe === 'feeder' ? '🚐' : (tp.tipe === 'kereta' ? '🚆' : '🚌');
            const icon = L.divIcon({
                className: 'custom-pin',
                html: `<div class="marker-pin marker-transport">${emoji}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            const marker = L.marker([tp.lat, tp.lng], { icon: icon });
            marker.bindPopup(`
                <div style="font-size:12px; line-height:1.4; min-width:210px;">
                    <b style="color:#6d28d9; font-size:13px;">${emoji} ${tp.nama}</b><br>
                    <span style="color:#475569; font-weight:600;">${tp.trayek}</span>
                    <hr style="margin:6px 0; border:0; border-top:1px solid #e2e8f0;">
                    🚶 <b>Ke SMAN 5:</b> ${tp.jarakKeSekolah}<br>
                    🎫 <b>Tarif:</b> ${tp.tarif}<br>
                    ⏱️ <b>Jadwal:</b> ${tp.jadwalInterval}<br>
                    <p style="margin-top:6px; font-style:italic; color:#64748b;">${tp.info}</p>
                </div>
            `);
            this.transportMarkersLayer.addLayer(marker);
        });
    },

    toggleTransport() {
        this.showTransport = !this.showTransport;
        if (this.showTransport) this.map.addLayer(this.transportMarkersLayer);
        else this.map.removeLayer(this.transportMarkersLayer);
        return this.showTransport;
    }
};

if (typeof window !== 'undefined') {
    window.MapView = MapView;
}
