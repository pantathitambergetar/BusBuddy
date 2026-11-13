/**
 * ==============================================================================
 * BUSBUDDY SMAN 5 SURABAYA - GPS, RUTE OSRM & SIMULASI (js/navigation/navigation.js)
 * ==============================================================================
 */

const NavigationModule = {
    userGpsMarker: null,
    userGpsCircle: null,
    userCoords: null, // [lat, lng]
    routeLayer: null,
    isManualLocation: false,
    isPickingLocation: false,
    simulationTimer: null,
    simulatedMarker: null,

    // 1. Pelacak GPS Otomatis
    startGPS() {
        if (!this.userCoords) {
            this.setUserLocation(-7.2588, 112.7430, 'Awal (Genteng Kali)');
        }

        if (!("geolocation" in navigator)) return;

        navigator.geolocation.watchPosition(
            (pos) => {
                if (!this.isManualLocation) {
                    this.setUserLocation(pos.coords.latitude, pos.coords.longitude, 'GPS Asli', pos.coords.accuracy);
                }
            },
            (err) => console.warn("GPS Notice:", err.message),
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
    },

    setUserLocation(lat, lng, label = 'Lokasi Anda', accuracy = 30) {
        this.userCoords = [lat, lng];
        if (window.MapManager) MapManager.userCoords = this.userCoords;

        const icon = L.divIcon({
            className: 'custom-pin',
            html: '<div class="marker-pin marker-user-me" style="background:#059669; color:white; border-color:#d1fae5; box-shadow:0 0 12px rgba(16,185,129,0.8);">👤</div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        const map = MapView.map;
        if (!map) return;

        if (!this.userGpsMarker) {
            this.userGpsMarker = L.marker([lat, lng], { icon: icon, draggable: true }).addTo(map);
            this.userGpsMarker.on('dragend', (e) => {
                const pos = e.target.getLatLng();
                this.isManualLocation = true;
                this.setUserLocation(pos.lat, pos.lng, 'Manual (Pin Digeser)');
                App.showToast("📍 Posisi jemput berhasil dipindahkan!");
            });

            this.userGpsCircle = L.circle([lat, lng], {
                radius: accuracy,
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.15,
                weight: 1
            }).addTo(map);
        } else {
            this.userGpsMarker.setLatLng([lat, lng]);
            this.userGpsMarker.setIcon(icon);
            this.userGpsCircle.setLatLng([lat, lng]);
            this.userGpsCircle.setRadius(accuracy);
        }

        const namaUser = (window.App && App.currentUser) ? App.currentUser.nama : 'Anda';
        this.userGpsMarker.bindPopup(`
            <div style="font-size:12px; line-height:1.4; min-width:180px;">
                <b style="color:#059669; font-size:13px;">👤 ${label}</b><br>
                <b>${namaUser}</b><br>
                <span style="color:#64748b; font-size:11px;">Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}</span><br>
                <span style="color:#0284c7; font-size:10px; display:block; margin-top:4px;">👉 <i>Tarik pin ini untuk menggeser titik jemput!</i></span>
            </div>
        `);

        if (window.App && App.onUserLocationFound) {
            App.onUserLocationFound(lat, lng);
        }
    },

    // 2. Pusatkan Peta ke Posisi Pengguna
    centerToUser() {
        if (!this.userCoords || !MapView.map) {
            App.showToast("⚠️ Lokasi GPS belum tersedia.");
            return;
        }
        MapView.map.setView(this.userCoords, 16);
        if (this.userGpsMarker) this.userGpsMarker.openPopup();
        App.showToast("📍 Berpusat ke posisi jemput Anda.");
    },

    // 3. Mode Memilih Titik Jemput di Peta
    toggleLocationPicker() {
        this.isPickingLocation = !this.isPickingLocation;
        if (!MapView.map) return;
        if (this.isPickingLocation) {
            MapView.map.getContainer().style.cursor = 'crosshair';
            App.showToast("🎯 Klik di mana saja pada peta untuk menentukan titik jemput Anda!");
        } else {
            MapView.map.getContainer().style.cursor = '';
        }
    },

    // 4. Kalkulator Jarak Haversine (km)
    getDistanceKm(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },

    // 5. Gambar Garis Rute (Navigasi OSRM Open-Source)
    async routeToDestination(startLat, startLng, nameTarget) {
        const map = MapView.map;
        if (!map) return;

        if (this.routeLayer) {
            map.removeLayer(this.routeLayer);
            this.routeLayer = null;
        }

        const destLat = SEKOLAH_DATA.lat;
        const destLng = SEKOLAH_DATA.lng;

        try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;
            const response = await fetch(osrmUrl);
            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                const routeCoords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                const distanceKm = (data.routes[0].distance / 1000).toFixed(1);
                const durationMin = Math.round(data.routes[0].duration / 60);

                this.routeLayer = L.polyline(routeCoords, {
                    color: '#2563eb',
                    weight: 5,
                    opacity: 0.8,
                    dashArray: '8, 8'
                }).addTo(map);

                map.fitBounds(this.routeLayer.getBounds(), { padding: [40, 40] });
                App.showToast(`🗺️ Rute ke SMAN 5 dari ${nameTarget}: ${distanceKm} km (~${durationMin} mnt)`);
            } else {
                throw new Error("Rute tidak ditemukan");
            }
        } catch (_) {
            this.routeLayer = L.polyline([[startLat, startLng], [destLat, destLng]], {
                color: '#3b82f6',
                weight: 4,
                dashArray: '5, 10'
            }).addTo(map);
            map.fitBounds(this.routeLayer.getBounds(), { padding: [40, 40] });
        }
    },

    // 6. Simulasi Perjalanan Live ke SMAN 5
    async simulateTripToSchool() {
        const map = MapView.map;
        if (!map) return;

        if (this.simulationTimer) {
            clearInterval(this.simulationTimer);
            this.simulationTimer = null;
            if (this.simulatedMarker) map.removeLayer(this.simulatedMarker);
            App.showToast("⏹️ Simulasi perjalanan dihentikan.");
            return;
        }

        const startCoords = this.userCoords || [-7.2588, 112.7430];
        const destLat = SEKOLAH_DATA.lat;
        const destLng = SEKOLAH_DATA.lng;

        App.showToast("🚀 Menyiapkan rute simulasi ke SMAN 5 Surabaya...");

        try {
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${destLng},${destLat}?overview=full&geometries=geojson`;
            const res = await fetch(osrmUrl);
            const data = await res.json();

            let routeCoords = [];
            if (data.routes && data.routes.length > 0) {
                routeCoords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            } else {
                for (let i = 0; i <= 20; i++) {
                    const ratio = i / 20;
                    routeCoords.push([
                        startCoords[0] + (destLat - startCoords[0]) * ratio,
                        startCoords[1] + (destLng - startCoords[1]) * ratio
                    ]);
                }
            }

            if (this.routeLayer) map.removeLayer(this.routeLayer);
            this.routeLayer = L.polyline(routeCoords, { color: '#10b981', weight: 6 }).addTo(map);
            map.fitBounds(this.routeLayer.getBounds(), { padding: [50, 50] });

            const simIcon = L.divIcon({
                className: 'custom-pin',
                html: '<div class="marker-pin marker-driver" style="font-size:18px; width:36px; height:36px; box-shadow:0 0 15px #10b981;">🛵</div>',
                iconSize: [36, 36],
                iconAnchor: [18, 18]
            });

            this.simulatedMarker = L.marker(routeCoords[0], { icon: simIcon }).addTo(map);
            this.simulatedMarker.bindPopup("<b>🛵 Menuju SMAN 5 Surabaya</b><br>Kecepatan: ~35 km/jam").openPopup();

            let step = 0;
            this.simulationTimer = setInterval(() => {
                step++;
                if (step >= routeCoords.length) {
                    clearInterval(this.simulationTimer);
                    this.simulationTimer = null;
                    this.simulatedMarker.setLatLng([destLat, destLng]);
                    this.simulatedMarker.bindPopup("<b>🎉 Tiba di Gerbang SMAN 5!</b><br>Tepat Waktu!").openPopup();
                    App.showToast("🎉 Siswa telah tiba di SMAN 5 Surabaya!");
                    return;
                }
                this.simulatedMarker.setLatLng(routeCoords[step]);
            }, 600);
        } catch (e) {
            App.showToast("⚠️ Gagal memuat simulasi rute.");
        }
    }
};

// Delegator MapManager untuk kompatibilitas penuh dengan kode dan event HTML
const MapManager = {
    get map() { return MapView.map; },
    get userCoords() { return NavigationModule.userCoords; },
    init() {
        MapView.init();
        NavigationModule.startGPS();
    },
    renderFriends(list) { MapView.renderFriends(list); },
    renderTransport() { MapView.renderTransport(); },
    toggleTransport() { return MapView.toggleTransport(); },
    centerToUser() { NavigationModule.centerToUser(); },
    toggleLocationPicker() { NavigationModule.toggleLocationPicker(); },
    routeToDestination(lat, lng, name) { NavigationModule.routeToDestination(lat, lng, name); },
    getDistanceKm(lat1, lon1, lat2, lon2) { return NavigationModule.getDistanceKm(lat1, lon1, lat2, lon2); },
    simulateTripToSchool() { NavigationModule.simulateTripToSchool(); }
};

if (typeof window !== 'undefined') {
    window.NavigationModule = NavigationModule;
    window.MapManager = MapManager;
}
