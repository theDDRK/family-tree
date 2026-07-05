import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { IPerson, IPersons } from '../interfaces/IPersons';

// Fix Leaflet marker icon asset paths in React
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIconPng,
    shadowUrl: markerShadowPng,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom styling icons for Birth vs Death
const birthIcon = L.divIcon({
    className: 'custom-div-icon',
    html: "<div style='background-color:#3b82f6; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);'></div>",
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

const deathIcon = L.divIcon({
    className: 'custom-div-icon',
    html: "<div style='background-color:#ec4899; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);'></div>",
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

// A comprehensive client-side coordinates dictionary of common Dutch & world places
const LOCATION_COORDINATES: Record<string, [number, number]> = {
    'amsterdam': [52.3676, 4.9041],
    'rotterdam': [51.9244, 4.4777],
    'den haag': [52.0705, 4.3007],
    's-gravenhage': [52.0705, 4.3007],
    'utrecht': [52.0907, 5.1214],
    'groningen': [53.2194, 6.5665],
    'eindhoven': [51.4416, 5.4697],
    'tilburg': [51.5555, 5.0913],
    'almere': [52.3702, 5.2233],
    'breda': [51.5719, 4.7683],
    'nijmegen': [51.8126, 5.8372],
    'apeldoorn': [52.2112, 5.9699],
    'haarlem': [52.3874, 4.6462],
    'enschede': [52.2215, 6.8937],
    'arnhem': [51.9851, 5.8987],
    'amersfoort': [52.1561, 5.3878],
    'zaanstad': [52.4420, 4.8292],
    'zaandam': [52.4420, 4.8292],
    'den bosch': [51.6978, 5.3037],
    'shertogenbosch': [51.6978, 5.3037],
    'zwolle': [52.5168, 6.0830],
    'leeuwarden': [53.2012, 5.7999],
    'maastricht': [50.8514, 5.6910],
    'assen': [52.9928, 6.5642],
    'middelburg': [51.4988, 3.6114],
    'delft': [52.0116, 4.3571],
    'deventer': [52.2562, 6.1604],
    'heerenveen': [52.9566, 5.9264],
    'sneek': [53.0325, 5.6599],
    'roermond': [51.1927, 5.9877],
    'venlo': [51.3700, 6.1680],
    'alkmaar': [52.6324, 4.7534],
    'hoorn': [52.6424, 5.0594],
    'gouda': [52.0116, 4.7105],
    'leiden': [52.1601, 4.4970],
    'dordrecht': [51.8133, 4.6901],
    'lelystad': [52.5185, 5.4714],
    'drachten': [53.1125, 6.1000],
    'dokkum': [53.3255, 5.9987],
    'franeker': [53.1868, 5.5414],
    'harlingen': [53.1745, 5.4140],
    'bolsward': [53.0617, 5.5264],
    'hindeloopen': [52.9436, 5.4014],
    'workum': [52.9796, 5.4439],
    'stavoren': [52.8872, 5.3587],
    'sloten': [52.8946, 5.6444],
    'ijlst': [53.0108, 5.6199],
    'emmen': [52.7858, 6.8975],
    'hoogeveen': [52.7286, 6.4764],
    'meppel': [52.6953, 6.1953],
    'coevorden': [52.6619, 6.7414],
    'heerlen': [50.8882, 5.9794],
    'sittard': [50.9983, 5.8697],
    'geleen': [50.9678, 5.8292],
    'weert': [51.2508, 5.7078],
    'venray': [51.5268, 5.9745],
    'valkenburg': [50.8653, 5.8307],
    'vlissingen': [51.4424, 3.5738],
    'goes': [51.5034, 3.8907],
    'terneuzen': [51.3250, 3.8277],
    'hulst': [51.2814, 4.0534],
    'veere': [51.5484, 3.6669],
    'bergen op zoom': [51.4950, 4.2887],
    'roosendaal': [51.5312, 4.4578],
    'den helder': [52.9564, 4.7607],
    'texel': [53.0542, 4.7972],
    'schagen': [52.7869, 4.7987],
    'purmerend': [52.5050, 4.9604],
    'hilversum': [52.2239, 5.1764],
    'wageningen': [51.9688, 5.6667],
    'ede': [52.0433, 5.6687],
    'zutphen': [52.1408, 6.1953],
    'harderwijk': [52.3486, 5.6204],
    'tiel': [51.8864, 5.4344],
    'nijkerk': [52.2225, 5.4842],
    'zeist': [52.0864, 5.2792],
    'nieuwegein': [52.0294, 5.0904],
    'houten': [52.0264, 5.1704],
    'soest': [52.1739, 5.2917],
    'woerden': [52.0858, 4.8837],
    'veenendaal': [52.0253, 5.5550],
    'schiedam': [51.9169, 4.4034],
    'vlaardingen': [51.9125, 4.3414],
    'spijkenisse': [51.8483, 4.3277],
    'alphen aan den rijn': [52.1286, 4.6578],
    'zoetermeer': [52.0607, 4.4934],
    'katwijk': [52.2033, 4.4125],
    'noordwijk': [52.2412, 4.4414],
    'wassenaar': [52.1444, 4.4014],
    'gorinchem': [51.8292, 4.9744],
    'zwijndrecht': [51.8153, 4.6364],
    'hendrik-ido-ambacht': [51.8469, 4.6404],
    'sliedrecht': [51.8225, 4.7777],
    'papendrecht': [51.8312, 4.6904],
    'hardinxveld-giessendam': [51.8242, 4.8387],
    'alblasserdam': [51.8664, 4.6578],
    'ridderkerk': [51.8708, 4.6034],
    'barendrecht': [51.8569, 4.5364],
    'vlaanderen': [51.0500, 3.7300],
    'antwerpen': [51.2194, 4.4025],
    'brussel': [50.8503, 4.3517],
    'gent': [51.0543, 3.7174],
    'luik': [50.6326, 5.5797],
    'brugge': [51.2090, 3.2247],
    'duitsland': [51.1657, 10.4515],
    'berlijn': [52.5200, 13.4050],
    'keulen': [50.9375, 6.9603],
    'dusseldorf': [51.2277, 6.7735],
    'munster': [51.9607, 7.6261],
    'kleve': [51.7892, 6.1378],
    'emmerik': [51.8308, 6.2412],
    'londen': [51.5074, -0.1278],
    'parijs': [48.8566, 2.3522]
};

// Resolve location name to coordinates safely
const resolveCoordinates = (placeName: string | null | undefined): [number, number] | null => {
    if (!placeName) return null;
    const cleanName = placeName.toLowerCase().replace(new RegExp('[.,/#!$%^&*;:{}=\\-_`~()]', 'g'), '').trim();

    // Direct lookup
    if (LOCATION_COORDINATES[cleanName]) return LOCATION_COORDINATES[cleanName];

    // Sub-match lookup (e.g. "Gemeente Sneek" -> "Sneek")
    const keys = Object.keys(LOCATION_COORDINATES);
    for (const key of keys) {
        if (cleanName.includes(key)) {
            return LOCATION_COORDINATES[key];
        }
    }

    return null;
};

interface IMapMarker {
    person: IPerson;
    type: 'birth' | 'death';
    place: string;
    coords: [number, number];
}

interface IMigrationLine {
    person: IPerson;
    from: [number, number];
    to: [number, number];
}

function MapPage({ persons }: { persons: IPersons }) {
    const [showBirths, setShowBirths] = useState(true);
    const [showDeaths, setShowDeaths] = useState(true);
    const [showMigrationLines, setShowMigrationLines] = useState(true);

    // Compute markers and migration flows
    const mapData = useMemo(() => {
        const markers: IMapMarker[] = [];
        const migrationLines: IMigrationLine[] = [];
        const cityCounts: Record<string, number> = {};

        persons.persons.forEach(p => {
            const bCoords = resolveCoordinates(p.birth?.place);
            const dCoords = resolveCoordinates(p.death?.place);

            if (p.birth?.place) {
                const city = p.birth.place.split(',')[0].trim();
                cityCounts[city] = (cityCounts[city] || 0) + 1;
            }

            if (bCoords) {
                markers.push({
                    person: p,
                    type: 'birth',
                    place: p.birth!.place!,
                    coords: bCoords
                });
            }

            if (dCoords) {
                markers.push({
                    person: p,
                    type: 'death',
                    place: p.death!.place!,
                    coords: dCoords
                });
            }

            // If coordinates exist for both, add birth-to-death migration line
            if (bCoords && dCoords && (bCoords[0] !== dCoords[0] || bCoords[1] !== dCoords[1])) {
                migrationLines.push({
                    person: p,
                    from: bCoords,
                    to: dCoords
                });
            }
        });

        // Top Birthplaces
        const topCities = Object.entries(cityCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([city, count]) => ({ city, count }));

        return { markers, migrationLines, topCities };
    }, [persons]);

    // Leaflet styles
    const containerStyle = {
        width: '100%',
        height: '500px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
    };

    return (
        <div className="page-container" style={{ maxWidth: '1100px' }}>
            <h1 className="page-title">Geografische Kaart & Migratie</h1>
            <p className="page-subtitle">Interactieve visualisatie van waar je voorouders zijn geboren, gestorven en naartoe zijn verhuisd.</p>

            {/* Map Filters & Controls */}
            <div className="card" style={{ padding: '20px 30px', marginBottom: '25px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filters:</span>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showBirths} onChange={() => setShowBirths(!showBirths)} style={{ accentColor: '#3b82f6' }} />
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>
                    Geboorteplaatsen
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showDeaths} onChange={() => setShowDeaths(!showDeaths)} style={{ accentColor: '#ec4899' }} />
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ec4899' }}></span>
                    Overlijdensplaatsen
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showMigrationLines} onChange={() => setShowMigrationLines(!showMigrationLines)} style={{ accentColor: '#a855f7' }} />
                    <span style={{ display: 'inline-block', width: '15px', height: '1.5px', backgroundColor: '#a855f7' }}></span>
                    Levensmigratie (Lijn)
                </label>
            </div>

            {/* Leaflet Map Card */}
            <div className="card" style={{ padding: '15px', marginBottom: '35px' }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <MapContainer center={[52.3, 5.3]} zoom={8} style={containerStyle}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Birth Markers */}
                        {showBirths && mapData.markers.filter(m => m.type === 'birth').map((m, idx) => (
                            <Marker key={`birth-${idx}`} position={m.coords} icon={birthIcon}>
                                <Popup>
                                    <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                                        <strong style={{ color: 'var(--primary-color)' }}>Geboorte</strong><br />
                                        <strong>{m.person.firstName} {m.person.lastName}</strong><br />
                                        Datum: {m.person.birth?.date || 'doop'}<br />
                                        Locatie: {m.place}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {/* Death Markers */}
                        {showDeaths && mapData.markers.filter(m => m.type === 'death').map((m, idx) => (
                            <Marker key={`death-${idx}`} position={m.coords} icon={deathIcon}>
                                <Popup>
                                    <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                                        <strong style={{ color: '#ec4899' }}>Overlijden</strong><br />
                                        <strong>{m.person.firstName} {m.person.lastName}</strong><br />
                                        Datum: {m.person.death?.date || 'onbekend'}<br />
                                        Locatie: {m.place}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {/* Migration Flow Lines */}
                        {showMigrationLines && mapData.migrationLines.map((line, idx) => (
                            <Polyline
                                key={`line-${idx}`}
                                positions={[line.from, line.to]}
                                pathOptions={{
                                    color: '#a855f7',
                                    weight: 1.5,
                                    dashArray: '5, 5',
                                    opacity: 0.7
                                }}
                            >
                                <Popup>
                                    <div style={{ fontSize: '13px' }}>
                                        <strong>Migratiepad</strong> van <strong>{line.person.firstName} {line.person.lastName}</strong><br />
                                        Van {line.person.birth?.place || 'geboorte'} naar {line.person.death?.place || 'overlijden'}
                                    </div>
                                </Popup>
                            </Polyline>
                        ))}
                    </MapContainer>
                </div>
            </div>

            {/* Bottom info section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
                {/* Popular Birthplaces Table */}
                <div className="card" style={{ padding: '30px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontWeight: '800' }}>Meest Voorkomende Geboorteplaatsen</h3>
                    {mapData.topCities.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>Plaatsnaam</th>
                                    <th style={{ textAlign: 'right' }}>Aantal Personen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mapData.topCities.map(({ city, count }, idx) => (
                                    <tr key={idx}>
                                        <td style={{ fontWeight: '600' }}>📍 {city}</td>
                                        <td style={{ textAlign: 'right', color: 'var(--primary-color)', fontWeight: '700' }}>{count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '13px', margin: 0 }}>
                            Geen locatiedata beschikbaar.
                        </p>
                    )}
                </div>

                {/* Map Legend & Explanation */}
                <div className="card" style={{ padding: '30px' }}>
                    <h3 style={{ margin: '0 0 15px 0', fontWeight: '800' }}>Kaartlegenda & Info</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>
                            <span><strong>Blauwe punten</strong> geven geboorteplaatsen van voorouders aan.</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ec4899' }}></span>
                            <span><strong>Roze punten</strong> geven de overlijdensplaatsen aan.</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ display: 'inline-block', width: '25px', height: '1.5px', backgroundColor: '#a855f7', borderTop: '2px dashed #a855f7' }}></span>
                            <span><strong>Paarse stippellijnen</strong> verbinden de geboorte- en overlijdenslocatie van dezelfde persoon, wat hun levensmigratie laat zien.</span>
                        </div>
                        <p style={{ margin: '10px 0 0 0', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                            De locaties worden client-side gegeocodeerd op basis van een bibliotheek van veelvoorkomende gemeentes en parochies in historische Nederlandse registers.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MapPage;
