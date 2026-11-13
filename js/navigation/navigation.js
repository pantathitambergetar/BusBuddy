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
    gpsWatchId: null,
    lastSentLat: null,
    lastSentLng: null,

    startGPS() {
        if (!window.App || !App.currentUser) return;
        if (!("geolocation" in navigator)) {
            if (!this.userCoords) this.setUserLocation(SEKOLAH_DATA.lat, SEKOLAH_DATA.lng, 'Default (Sekolah)', 500);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                if (!this.isManualLocation && window.App && App.currentUser) {
                    const { latitude, longitude, accuracy } = pos.coords;
                    this.setUserLocation(latitude, longitude, 'Lokasi GPS', accuracy);
                    this._updateUserLocationInDB(latitude, longitude);
                }
            },
            () => {
                if (!this.userCoords && window.App && App.currentUser) this.setUserLocation(SEKOLAH_DATA.lat, SEKOLAH_DATA.lng, 'Default (Sekolah)', 500);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );

        if (this.gpsWatchId !== null) navigator.geolocation.clearWatch(this.gpsWatchId);
        this.gpsWatchId = navigator.geolocation.watchPosition(
            (pos) => {
                if (this.isManualLocation || !window.App || !App.currentUser) return;
                const { latitude, longitude, accuracy } = pos.coords;
                if (accuracy <= 150) {
                    this.setUserLocation(latitude, longitude, 'GPS Realtime', accuracy);
                    const moved = !this.lastSentLat || this.getDistanceKm(this.lastSentLat, this.lastSentLng, latitude, longitude) > 0.015;
                    if (moved) {
                        this.lastSentLat = latitude;
                        this.lastSentLng = longitude;
                        this._updateUserLocationInDB(latitude, longitude);
                    }
                }
            },
            (err) => console.warn("GPS Watch:", err.message),
            { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
        );
    },

    stopGPS() {
        if (this.gpsWatchId !== null && "geolocation" in navigator) {
            navigator.geolocation.clearWatch(this.gpsWatchId);
            this.gpsWatchId = null;
        }
        this.clearUserLocation();
    },

    clearUserLocation() {
        this.userCoords = null;
        this.lastSentLat = null;
        this.lastSentLng = null;
        this.isManualLocation = false;
        if (window.MapManager) MapManager.userCoords = null;
        if (this.userGpsMarker && MapView.map) { MapView.map.removeLayer(this.userGpsMarker); this.userGpsMarker = null; }
        if (this.userGpsCircle && MapView.map) { MapView.map.removeLayer(this.userGpsCircle); this.userGpsCircle = null; }
        if (this.routeLayer && MapView.map) { MapView.map.removeLayer(this.routeLayer); this.routeLayer = null; }
    },

    // Update koordinat pengguna ke database jika sudah login
    _updateUserLocationInDB(lat, lng) {
        const user = window.App && App.currentUser;
        if (!user || user.peran === 'developer' || !window.ApiService || !ApiService.isOnline) return;
        const userId = user.id;
        if (!userId) return;
        ApiService._fetch(`/students/${userId}`, { method: 'PUT', body: JSON.stringify({ lat, lng, status: 'online' }) }).catch(() => {});
    },

    setUserLocation(lat, lng, label = 'Lokasi Anda', accuracy = 30) {
        if (!window.App || !App.currentUser) return;
        this.userCoords = [lat, lng];
        if (window.MapManager) MapManager.userCoords = this.userCoords;

        // Warna lingkaran akurasi: hijau = bagus, kuning = sedang, merah = buruk
        const accColor = accuracy < 50 ? '#10b981' : (accuracy < 200 ? '#f59e0b' : '#ef4444');
        const accLabel = accuracy < 50 ? '✅ Akurat' : (accuracy < 200 ? '⚠️ Sedang' : '📡 Mencari...');

        const icon = L.divIcon({
            className: 'custom-pin',
            html: `<div class="marker-pin marker-user-me" style="background:#059669; color:white; border-color:#d1fae5; box-shadow:0 0 12px rgba(16,185,129,0.8);">👤</div>`,
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
                this.setUserLocation(pos.lat, pos.lng, 'Manual (Pin Digeser)', 10);
                App.showToast("📍 Posisi jemput berhasil dipindahkan!");
            });

            this.userGpsCircle = L.circle([lat, lng], {
                radius: Math.min(accuracy, 500),
                color: accColor,
                fillColor: accColor,
                fillOpacity: 0.1,
                weight: 1
            }).addTo(map);
        } else {
            this.userGpsMarker.setLatLng([lat, lng]);
            this.userGpsMarker.setIcon(icon);
            this.userGpsCircle.setLatLng([lat, lng]);
            this.userGpsCircle.setRadius(Math.min(accuracy, 500));
            this.userGpsCircle.setStyle({ color: accColor, fillColor: accColor });
        }

        const namaUser = (window.App && App.currentUser) ? App.currentUser.nama : 'Anda';
        this.userGpsMarker.bindPopup(`
            <div style="font-size:12px; line-height:1.6; min-width:200px;">
                <b style="color:#059669; font-size:13px;">👤 ${namaUser}</b><br>
                <span style="color:#475569;">${label}</span><br>
                <span style="color:#64748b; font-size:11px;">📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}</span><br>
                <span style="font-size:10px; color:${accColor}; font-weight:600;">${accLabel} (±${Math.round(accuracy)}m)</span><br>
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

                this.routeLayer = L.polyline(routeCoords, { color: '#2563eb', weight: 5, opacity: 0.8, dashArray: '8, 8' }).addTo(map);
                map.fitBounds(this.routeLayer.getBounds(), { padding: [40, 40] });
                App.showToast(`🗺️ Rute ke SMAN 5: ${distanceKm} km (~${durationMin} mnt)`);
            } else { throw new Error("Rute nihil"); }
        } catch (_) {
            this.routeLayer = L.polyline([[startLat, startLng], [destLat, destLng]], { color: '#3b82f6', weight: 4, dashArray: '5, 10' }).addTo(map);
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

        const start = this.userCoords || [SEKOLAH_DATA.lat, SEKOLAH_DATA.lng];
        const dest = [SEKOLAH_DATA.lat, SEKOLAH_DATA.lng];
        App.showToast("🚀 Menyiapkan rute simulasi ke SMAN 5 Surabaya...");

        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`;
            const res = await fetch(url);
            const data = await res.json();
            let routeCoords = (data.routes && data.routes.length > 0)
                ? data.routes[0].geometry.coordinates.map(c => [c[1], c[0]])
                : Array.from({length: 21}, (_, i) => [
                    start[0] + (dest[0] - start[0]) * (i / 20),
                    start[1] + (dest[1] - start[1]) * (i / 20)
                ]);

            if (this.routeLayer) map.removeLayer(this.routeLayer);
            this.routeLayer = L.polyline(routeCoords, { color: '#10b981', weight: 6 }).addTo(map);
            map.fitBounds(this.routeLayer.getBounds(), { padding: [50, 50] });

            const simIcon = L.divIcon({
                className: 'custom-pin',
                html: '<div class="marker-pin marker-driver" style="font-size:18px;width:36px;height:36px;box-shadow:0 0 15px #10b981;">🛵</div>',
                iconSize: [36, 36], iconAnchor: [18, 18]
            });
            this.simulatedMarker = L.marker(routeCoords[0], { icon: simIcon }).addTo(map);
            this.simulatedMarker.bindPopup("<b>🛵 Menuju SMAN 5 Surabaya</b><br>Kecepatan: ~35 km/jam").openPopup();
            let step = 0;
            this.simulationTimer = setInterval(() => {
                step++;
                if (step >= routeCoords.length) {
                    clearInterval(this.simulationTimer); this.simulationTimer = null;
                    this.simulatedMarker.setLatLng(dest);
                    this.simulatedMarker.bindPopup("<b>🎉 Tiba di Gerbang SMAN 5!</b><br>Tepat Waktu!").openPopup();
                    App.showToast("🎉 Siswa telah tiba di SMAN 5 Surabaya!");
                    return;
                }
                this.simulatedMarker.setLatLng(routeCoords[step]);
            }, 600);
        } catch (e) { App.showToast("⚠️ Gagal memuat simulasi rute."); }
    }
};

// Delegator MapManager untuk kompatibilitas penuh dengan kode dan event HTML
const MapManager = {
    get map() { return MapView.map; },
    get userCoords() { return NavigationModule.userCoords; },
    init() {
        MapView.init();
        if (window.App && App.currentUser) NavigationModule.startGPS();
    },
    stopGPS() { NavigationModule.stopGPS(); },
    clearUserLocation() { NavigationModule.clearUserLocation(); },
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
