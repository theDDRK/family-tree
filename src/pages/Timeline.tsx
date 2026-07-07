import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IPerson, IPersons } from '../interfaces/IPersons';
import { getYearSafe } from '../utils/dateUtils';

interface IHistoryEvent {
    year: number;
    endYear?: number;
    title: string;
    description: string;
    category: 'NL' | 'Wereld' | 'Religie' | 'Wetenschap' | 'Ramp' | 'Oorlog';
    icon: string;
}

const CATEGORY_STYLE: Record<string, { bg: string; color: string; border: string }> = {
    'NL':         { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    'Wereld':     { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    'Religie':    { bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff' },
    'Wetenschap': { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    'Ramp':       { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
    'Oorlog':     { bg: '#1e293b', color: '#f1f5f9', border: '#334155' },
};

const HISTORICAL_EVENTS: IHistoryEvent[] = [
    // ── 1450–1600 ──────────────────────────────────────────────────
    { year: 1450, title: 'Uitvinding van de boekdrukkunst', description: 'Johannes Gutenberg ontwikkelt de drukpers met losse letters. Boeken worden voor het eerst op grote schaal verspreid.', category: 'Wetenschap', icon: '📖' },
    { year: 1453, title: 'Val van Constantinopel', description: 'Het Ottomaanse Rijk verovert Constantinopel; einde van het Byzantijnse Rijk en het middeleeuws tijdperk.', category: 'Wereld', icon: '🏰' },
    { year: 1492, title: 'Columbus bereikt Amerika', description: 'Christoffel Columbus bereikt de Caraïben namens de Spaanse kroon; begin van de Europese kolonisatie van Amerika.', category: 'Wereld', icon: '⛵' },
    { year: 1517, title: 'Reformatie — 95 stellingen van Luther', description: 'Maarten Luther publiceert zijn 95 stellingen en luidt de protestantse Reformatie in, met grote gevolgen voor de Nederlanden.', category: 'Religie', icon: '✝️' },
    { year: 1543, title: 'Heliocentrisch Stelsel — Copernicus', description: 'Nicolaas Copernicus publiceert zijn theorie dat de aarde om de zon draait, een revolutie in het wetenschappelijk denken.', category: 'Wetenschap', icon: '🔭' },
    { year: 1566, title: 'Beeldenstorm in de Nederlanden', description: 'Calvinisten vernietigen katholieke beelden en relieken in kerken door heel de Nederlanden; aanleiding voor de Tachtigjarige Oorlog.', category: 'Religie', icon: '🗿' },
    { year: 1568, endYear: 1648, title: 'Tachtigjarige Oorlog (Opstand)', description: 'De Nederlanden komen in opstand tegen Spanje. Leidt uiteindelijk tot de onafhankelijkheid van de Republiek der Zeven Verenigde Nederlanden.', category: 'Oorlog', icon: '⚔️' },
    { year: 1572, title: 'Inname van Den Briel', description: 'De Watergeuzen nemen Den Briel in; symbolisch startschot van de Nederlandse Opstand. "Den Briel heeft Alva een bril verkocht."', category: 'NL', icon: '⚓' },
    { year: 1575, title: 'Oprichting Universiteit Leiden', description: 'Willem van Oranje sticht de Universiteit Leiden als beloning voor de dappere weerstand van de stad tijdens het Spaanse beleg.', category: 'NL', icon: '🎓' },
    { year: 1576, title: 'Spaanse Furie — Antwerpen', description: 'Spaanse soldaten plunderen en vermoorden 8.000 inwoners van Antwerpen; keerpunt in de Nederlanden.', category: 'Oorlog', icon: '🔥' },
    { year: 1579, title: 'Unie van Utrecht', description: 'De noordelijke gewesten sluiten de Unie van Utrecht, de grondslag van de latere Republiek der Nederlanden.', category: 'NL', icon: '📜' },
    { year: 1588, title: 'Ondergang van de Spaanse Armada', description: 'De Spaanse vloot wordt verslagen bij Engeland; Spanje verliest zijn zeehegemonie, de weg ligt open voor Nederlandse expansie.', category: 'Oorlog', icon: '🌊' },

    // ── 1600–1700 ──────────────────────────────────────────────────
    { year: 1600, title: 'Oprichting VOC (Voorloper)', description: 'De eerste compagnieën die later de VOC vormen beginnen hun activiteiten in Azië.', category: 'NL', icon: '🚢' },
    { year: 1602, title: 'VOC opgericht — begin Gouden Eeuw', description: 'De Vereenigde Oost-Indische Compagnie wordt opgericht; eerste naamloze vennootschap ter wereld. Begin van de Nederlandse Gouden Eeuw.', category: 'NL', icon: '💰' },
    { year: 1609, title: 'Bestand van Antwerpen (12-jarig bestand)', description: 'Spanje erkent de facto de Republiek der Nederlanden; tijdperk van vrede en economische bloei.', category: 'NL', icon: '🕊️' },
    { year: 1618, endYear: 1648, title: 'Dertigjarige Oorlog', description: 'Verschrikkelijke godsdienstoorlog die heel Europa verwoest en een derde van de bevolking van Duitsland het leven kost.', category: 'Oorlog', icon: '💀' },
    { year: 1621, title: 'WIC opgericht', description: 'De West-Indische Compagnie wordt opgericht voor handel en koloniën in Amerika en Afrika.', category: 'NL', icon: '🌍' },
    { year: 1626, title: 'Nieuwe Amsterdam — Manhattan', description: 'De Nederlanders stichten Nieuw Amsterdam op Manhattan (het latere New York).', category: 'NL', icon: '🏙️' },
    { year: 1637, title: 'Tulpenmanie — eerste beurscrash', description: 'De tulpenbollenprijzen bereiken astronomische hoogten en storten vervolgens in; de eerste gedocumenteerde speculatiebubbel.', category: 'NL', icon: '🌷' },
    { year: 1642, title: 'De Nachtwacht — Rembrandt', description: 'Rembrandt van Rijn voltooit De Nachtwacht, een van de beroemdste schilderijen ter wereld.', category: 'NL', icon: '🖼️' },
    { year: 1648, title: 'Vrede van Westfalen', description: 'Einde van de Tachtigjarige en Dertigjarige Oorlog. Internationale erkenning van de onafhankelijkheid van de Republiek der Nederlanden.', category: 'NL', icon: '📜' },
    { year: 1652, endYear: 1674, title: 'Engels-Nederlandse Oorlogen', description: 'Reeks van zeeoorlogen tussen de Republiek en Engeland om handelshegemonie op de oceanen.', category: 'Oorlog', icon: '⚔️' },
    { year: 1665, title: 'Grote Pest van Londen', description: 'De builenpest doodt ruim 100.000 mensen in Londen; kort daarna volgt de Grote Brand van Londen in 1666.', category: 'Ramp', icon: '💀' },
    { year: 1672, title: 'Rampjaar — Inval van Frankrijk', description: 'Het "rampjaar": Frankrijk, Engeland, Keulen en Münster vallen tegelijk de Republiek aan. Johan de Witt wordt vermoord.', category: 'Oorlog', icon: '⚠️' },
    { year: 1688, title: 'Glorieuze Revolutie', description: 'Stadhouder Willem III van Oranje wordt, met steun van het Engelse parlement, uitgenodigd als koning van Engeland.', category: 'NL', icon: '👑' },

    // ── 1700–1800 ──────────────────────────────────────────────────
    { year: 1702, title: 'Spaanse Successieoorlog', description: 'Europa raakt verwikkeld in een grote oorlog om de Spaanse troon; de Republiek raakt uitgeput en haar macht begint te tanen.', category: 'Oorlog', icon: '⚔️' },
    { year: 1720, title: 'Mississippi-bubbel & South Sea Bubble', description: 'Massale speculatiecrisissen in Frankrijk en Engeland veroorzaken de eerste grote internationale financiële crisis.', category: 'Wereld', icon: '📉' },
    { year: 1740, endYear: 1748, title: 'Oostenrijkse Successieoorlog', description: 'Groot Europees conflict waarbij ook de Republiek betrokken raakt; begin van het einde van de Republiek als grote mogendheid.', category: 'Oorlog', icon: '⚔️' },
    { year: 1747, title: 'Herstel van het Stadhouderschap', description: 'Willem IV wordt stadhouder van alle gewesten na Franse inval; de Oranjedynastie herrijst.', category: 'NL', icon: '🍊' },
    { year: 1755, title: 'Aardbeving van Lissabon', description: 'Een verwoestende aardbeving en tsunami vernietigt Lissabon en schokt heel Europa; eerste grote modern gedocumenteerde ramp.', category: 'Ramp', icon: '🌊' },
    { year: 1769, title: 'Stoommachine — Industriële Revolutie', description: 'James Watt patentteert zijn verbeterde stoommachine; begin van de Industriële Revolutie die de wereld voor altijd verandert.', category: 'Wetenschap', icon: '⚙️' },
    { year: 1776, title: 'Amerikaanse Onafhankelijkheidsverklaring', description: 'De dertien Amerikaanse koloniën verklaren zich onafhankelijk van Groot-Brittannië.', category: 'Wereld', icon: '🗽' },
    { year: 1780, endYear: 1784, title: 'Vierde Engels-Nederlandse Oorlog', description: 'Verwoestende oorlog tegen Engeland; de Republiek verliest haar overzeese bezittingen en haar positie als zeehandelsrijk.', category: 'Oorlog', icon: '⚓' },
    { year: 1789, title: 'Franse Revolutie', description: 'Begin van de Franse Revolutie. Bestorming van de Bastille op 14 juli; "Liberté, Égalité, Fraternité."', category: 'Wereld', icon: '🗼' },
    { year: 1795, title: 'Bataafse Republiek — einde Republiek', description: 'De Fransen trekken over de bevroren rivieren; oprichting van de Bataafse Republiek; einde van de oude Republiek der Nederlanden.', category: 'NL', icon: '🏳️' },

    // ── 1800–1900 ──────────────────────────────────────────────────
    { year: 1804, title: 'Napoleon Bonaparte — Keizer van Frankrijk', description: 'Napoleon kroont zichzelf tot keizer en begint aan zijn veroveringsveldtochten door heel Europa.', category: 'Wereld', icon: '👑' },
    { year: 1806, title: 'Koninkrijk Holland — Lodewijk Napoleon', description: 'Napoleon sticht het Koninkrijk Holland met zijn broer Lodewijk als koning; Nederland wordt een vazalstaat.', category: 'NL', icon: '👑' },
    { year: 1810, title: 'Nederland ingelijfd bij Frankrijk', description: 'Napoleon lijft het Koninkrijk Holland in bij het Franse Keizerrijk; Nederland wordt Frans departement.', category: 'NL', icon: '🇫🇷' },
    { year: 1812, title: 'Napoleons Russische Campagne', description: 'Napoleon marcheert met 600.000 man naar Moskou; de catastrofale terugtocht vernietigt de Grande Armée.', category: 'Oorlog', icon: '❄️' },
    { year: 1813, title: 'Bevrijding van Nederland — Oranje keert terug', description: 'Na Napoleons ineenstorting keert Willem I terug naar Nederland; oprichting van het Koninkrijk der Nederlanden.', category: 'NL', icon: '🍊' },
    { year: 1815, title: 'Slag bij Waterloo', description: 'Definitieve nederlaag van Napoleon. Oprichting van het Verenigd Koninkrijk der Nederlanden (inclusief België) onder Willem I.', category: 'Wereld', icon: '⚔️' },
    { year: 1816, title: 'Jaar zonder zomer — uitbarsting Tambora', description: 'De vulkaanuitbarsting van de Tambora veroorzaakt wereldwijd misoogsten, hongersnood en extreme kou in de zomer van 1816.', category: 'Ramp', icon: '🌋' },
    { year: 1830, title: 'Belgische Revolutie', description: 'België scheidt zich af van het Koninkrijk der Nederlanden na een opstand in Brussel. Willem I erkent dit pas in 1839.', category: 'NL', icon: '🇧🇪' },
    { year: 1832, title: 'Belgische Tiendaagse Veldtocht', description: 'Willem I valt België binnen met zijn leger maar wordt gedwongen zich terug te trekken door Franse tussenkomst.', category: 'Oorlog', icon: '⚔️' },
    { year: 1839, title: 'Scheiding België definitief', description: 'Nederland erkent bij het Verdrag van Londen definitief de onafhankelijkheid van België en de grenzen worden vastgelegd.', category: 'NL', icon: '📜' },
    { year: 1845, endYear: 1852, title: 'Ierse Hongersnood', description: 'Aardappelziekte vernietigt de oogst; een miljoen Ieren sterven, een miljoen emigreren; enorme demografische catastrofe.', category: 'Ramp', icon: '🥔' },
    { year: 1848, title: 'Europese Revoluties & Thorbecke', description: 'Revolutiegolf door Europa. In Nederland herziet Thorbecke de grondwet; Nederland wordt parlementaire democratie.', category: 'NL', icon: '📜' },
    { year: 1859, title: 'Darwin — Oorsprong der Soorten', description: 'Charles Darwin publiceert "On the Origin of Species"; de evolutietheorie schokt de wetenschappelijke en religieuze wereld.', category: 'Wetenschap', icon: '🦎' },
    { year: 1863, title: 'Afschaffing slavernij in Suriname & Antillen', description: 'Nederland schaft de slavernij af in zijn koloniën. Meer dan 33.000 mensen worden formeel vrij verklaard.', category: 'NL', icon: '⛓️' },
    { year: 1866, title: 'Grote cholera-epidemie in Nederland', description: 'Een zware cholera-uitbraak treft heel Nederland; duizenden doden; aanzet tot verbetering van rioolstelsels.', category: 'Ramp', icon: '💧' },
    { year: 1876, title: 'Telefoon uitgevonden — Alexander Bell', description: 'Alexander Graham Bell patentteert de telefoon; begin van de telecommunicatierevolutie.', category: 'Wetenschap', icon: '📞' },
    { year: 1879, title: 'Elektrisch licht — Edison', description: 'Thomas Edison demonstreert een praktische gloeilamp; de wereld begint te verlichten.', category: 'Wetenschap', icon: '💡' },
    { year: 1885, title: 'Rijwielboom & opkomst van de fiets', description: 'De moderne fiets met gelijke wielen wordt uitgevonden; in Nederland wordt de fiets het volkstransport bij uitstek.', category: 'NL', icon: '🚲' },
    { year: 1890, title: 'Koningin Wilhelmina — regentschap Emma', description: 'Willem III overlijdt; zijn tienjarige dochter Wilhelmina wordt koningin onder regentschap van koningin Emma.', category: 'NL', icon: '👸' },
    { year: 1898, title: 'Inhuldiging Koningin Wilhelmina', description: 'Koningin Wilhelmina wordt ingehuldigd als volwaardig vorstin van het Koninkrijk der Nederlanden.', category: 'NL', icon: '👑' },

    // ── 1900–2000 ──────────────────────────────────────────────────
    { year: 1903, title: 'Eerste gemotoriseerde vlucht — Wright', description: 'Orville en Wilbur Wright maken de eerste succesvolle gemotoriseerde vliegtuigvlucht bij Kitty Hawk.', category: 'Wetenschap', icon: '✈️' },
    { year: 1906, title: 'Aardbeving San Francisco', description: 'Een verwoestende aardbeving en brand verwoest San Francisco; meer dan 3.000 doden.', category: 'Ramp', icon: '🌍' },
    { year: 1912, title: 'Ondergang van de Titanic', description: 'Het "onzinkbare" stoomschip Titanic zinkt na een aanvaring met een ijsberg; meer dan 1.500 doden.', category: 'Ramp', icon: '🚢' },
    { year: 1914, endYear: 1918, title: 'Eerste Wereldoorlog', description: 'Mondiaal conflict dat 20 miljoen levens eist. Nederland blijft neutraal maar mobiliseert zijn leger en lijdt economisch zwaar.', category: 'Oorlog', icon: '💣' },
    { year: 1917, title: 'Russische Revolutie', description: 'De bolsjewieken nemen de macht over in Rusland; begin van de Sovjet-Unie en de communistische beweging wereldwijd.', category: 'Wereld', icon: '☭' },
    { year: 1918, title: 'Spaanse Griep', description: 'Wereldwijde influenzapandemie infecteert 500 miljoen mensen en doodt 50–100 miljoen mensen; ook Nederland zwaar getroffen.', category: 'Ramp', icon: '🦠' },
    { year: 1918, title: 'Einde WO1 — vrouwenkiesrecht NL', description: 'Wapenstilstand op 11 november. In Nederland krijgen vrouwen actief kiesrecht (vanaf 1922); grote democratische vooruitgang.', category: 'NL', icon: '🕊️' },
    { year: 1929, title: 'Beurskrach — Grote Depressie', description: 'De beurs van New York stort in op Zwarte Donderdag; de wereldwijde Grote Depressie begint, met massale werkloosheid.', category: 'Wereld', icon: '📉' },
    { year: 1932, title: 'Afsluitdijk geopend', description: 'De Afsluitdijk wordt geopend; de Zuiderzee wordt omgevormd tot het IJsselmeer, een ingenieurstechnische mijlpaal.', category: 'NL', icon: '🌊' },
    { year: 1939, endYear: 1945, title: 'Tweede Wereldoorlog', description: 'Wereldwijde oorlog; 70–85 miljoen doden. Nederland wordt op 10 mei 1940 bezet door Nazi-Duitsland.', category: 'Oorlog', icon: '💣' },
    { year: 1940, title: 'Bombardement Rotterdam', description: 'Nazi-Duitsland bombardeert het centrum van Rotterdam op 14 mei 1940; 800 doden, 80.000 daklozen. Nederland capituleert.', category: 'Ramp', icon: '💥' },
    { year: 1944, title: 'D-Day — Geallieerde landing Normandië', description: 'De grootste amfibische militaire operatie ooit; begin van de bevrijding van West-Europa van het nazisme.', category: 'Oorlog', icon: '🏖️' },
    { year: 1944, endYear: 1945, title: 'Hongerwinter', description: 'Dramatisch voedseltekort in het nog bezette westen van Nederland; geschat 18.000–22.000 doden van honger en kou.', category: 'Ramp', icon: '🥶' },
    { year: 1945, title: 'Bevrijding van Nederland (5 mei)', description: 'Canada en geallieerde troepen bevrijden Nederland volledig. Op 5 mei ondertekent Duitsland de capitulatie; bevrijdingsdag.', category: 'NL', icon: '🎉' },
    { year: 1945, title: 'Atoombommen op Hiroshima & Nagasaki', description: 'De VS gooit atoombommen op twee Japanse steden; het tijdperk van de kernwapens begint. Einde van WO2 in de Pacific.', category: 'Wereld', icon: '☢️' },
    { year: 1948, title: 'Universele Verklaring van de Rechten van de Mens', description: 'De VN stelt de UVRM op als antwoord op de gruwelen van de oorlog; een fundament van het internationale recht.', category: 'Wereld', icon: '📜' },
    { year: 1949, title: 'NAVO opgericht & Indonesische onafhankelijkheid', description: 'De NAVO wordt opgericht; Nederland erkent Indonesische onafhankelijkheid na jaren van koloniale strijd.', category: 'Wereld', icon: '🌐' },
    { year: 1953, title: 'Watersnoodramp', description: 'Zware stormvloed teistert Zeeland, Zuid-Holland en West-Brabant; 1.836 slachtoffers; aanzet tot het Deltaplan.', category: 'Ramp', icon: '🌊' },
    { year: 1957, title: 'Sputnik & Ruimterace', description: 'De Sovjet-Unie lanceert Sputnik 1, de eerste kunstmaan; de ruimterace tussen de VS en USSR begint.', category: 'Wetenschap', icon: '🛰️' },
    { year: 1961, title: 'Berlijnse Muur gebouwd', description: 'Oost-Duitsland bouwt de Berlijnse Muur om de massale vlucht naar West-Berlijn te stoppen; symbool van de Koude Oorlog.', category: 'Wereld', icon: '🧱' },
    { year: 1962, title: 'Cubaanse Rakettencrisis', description: 'Veertien dagen die de wereld aan de rand van een kernoorlog brengen; diplomatieke crisis tussen de VS en de USSR.', category: 'Wereld', icon: '☢️' },
    { year: 1969, title: 'Maanlanding — Apollo 11', description: 'Neil Armstrong en Buzz Aldrin zetten als eerste mensen voet op de maan op 20 juli 1969. "One giant leap for mankind."', category: 'Wetenschap', icon: '🌕' },
    { year: 1973, title: 'Oliecrisis — Autoloze Zondag', description: 'OPEC-embargo leidt tot olietekort; in Nederland worden autoloze zondagen ingevoerd; benzine op de bon.', category: 'NL', icon: '⛽' },
    { year: 1975, title: 'Surinaamse onafhankelijkheid', description: 'Suriname wordt onafhankelijk van Nederland; 144.000 Surinamers vestigen zich in de jaren daarna in Nederland.', category: 'NL', icon: '🌎' },
    { year: 1980, title: 'Inhuldiging Koningin Beatrix — Rellen Amsterdam', description: 'Koningin Beatrix wordt ingehuldigd. In Amsterdam breken rellen uit ("Geen woning, geen kroning").', category: 'NL', icon: '👑' },
    { year: 1986, title: 'Ramp Tsjernobyl', description: 'Explosie in de Sovjet kerncentrale Tsjernobyl; grootste nucleaire ramp ooit; straling bereikt ook Nederland.', category: 'Ramp', icon: '☢️' },
    { year: 1989, title: 'Val van de Berlijnse Muur', description: 'Op 9 november 1989 valt de Berlijnse Muur; einde van de Koude Oorlog en de deling van Duitsland.', category: 'Wereld', icon: '🧱' },
    { year: 1990, title: 'Hereniging van Duitsland', description: 'West- en Oost-Duitsland herenigingen; einde van de naoorlogse deling van Europa.', category: 'Wereld', icon: '🇩🇪' },
    { year: 1991, title: 'Val van de Sovjet-Unie', description: 'De USSR lost officieel op op 25 december 1991; 15 nieuwe landen ontstaan; einde van de Koude Oorlog.', category: 'Wereld', icon: '🌍' },
    { year: 1992, title: 'Bijlmerramp', description: 'Een vrachtvliegtuig van El Al crasht op de Bijlmer; 43 doden en honderden gewonden in Amsterdam.', category: 'Ramp', icon: '✈️' },
    { year: 1993, title: 'Oprichting Europese Unie', description: 'Het Verdrag van Maastricht treedt in werking; de Europese Unie met gemeenschappelijke munt en burgerrechten wordt werkelijkheid.', category: 'Wereld', icon: '🇪🇺' },
    { year: 1995, title: 'Wateroverlast — Rivieren treden buiten oevers', description: 'Extreme overstromingen van Rijn en Maas; 250.000 mensen geëvacueerd in Nederland; grootschalige noodsituatie.', category: 'Ramp', icon: '🌊' },
    { year: 1999, title: 'Invoering Euro & Srebrenica-rapport', description: 'De euro wordt als boekhoudkundige munt ingevoerd. Srebrenica-rapport brengt de val van de enclave in 1995 in beeld.', category: 'NL', icon: '💶' },
    { year: 2000, title: 'Millenniumwisseling', description: 'Wereldwijde millenniumviering; de "Y2K-bug" blijkt mee te vallen. De 21e eeuw begint.', category: 'Wereld', icon: '🎆' },

    // ── 2000–heden ─────────────────────────────────────────────────
    { year: 2001, title: 'Aanslagen van 11 september', description: 'Terroristische aanslagen op de Twin Towers en het Pentagon; 2.996 doden; de wereld verandert fundamenteel.', category: 'Wereld', icon: '🏙️' },
    { year: 2002, title: 'Pim Fortuyn vermoord', description: 'De politicus Pim Fortuyn wordt negen dagen voor de verkiezingen doodgeschoten; politieke schok in Nederland.', category: 'NL', icon: '🇳🇱' },
    { year: 2004, title: 'Vermoord Theo van Gogh & Tsunami Azië', description: 'Filmmaker Theo van Gogh vermoord in Amsterdam. Een gigantische tsunami in de Indische Oceaan doodt 230.000 mensen.', category: 'Wereld', icon: '🌊' },
    { year: 2008, title: 'Financiële Crisis', description: 'De mondiale financiële crisis begint met het faillissement van Lehman Brothers; zwaarste economische crisis sedert de jaren 30.', category: 'Wereld', icon: '📉' },
    { year: 2013, title: 'Abdicatie Beatrix — Inhuldiging Willem-Alexander', description: 'Koningin Beatrix doet afstand van de troon; Willem-Alexander wordt de eerste koning van Nederland in 123 jaar.', category: 'NL', icon: '👑' },
    { year: 2014, title: 'MH17 neergeschoten boven Oekraïne', description: '298 doden, van wie 196 Nederlanders, bij het neerschieten van vlucht MH17; nationale rouw in Nederland.', category: 'Ramp', icon: '✈️' },
    { year: 2019, endYear: 2022, title: 'COVID-19 Pandemie', description: 'Wereldwijde pandemie; lockdowns, mondkapjes en vaccinatiecampagnes. Meer dan 6 miljoen doden wereldwijd.', category: 'Ramp', icon: '🦠' },
    { year: 2022, title: 'Russische invasie van Oekraïne', description: 'Rusland valt Oekraïne binnen op 24 februari 2022; de grootste oorlog in Europa sedert WO2.', category: 'Oorlog', icon: '🇺🇦' },
].sort((a, b) => a.year - b.year);



function Timeline({ persons }: { persons: IPersons }) {
    const yearsRange = useMemo(() => {
        let minYear = 2026;
        let maxYear = 1700;
        persons.persons.forEach(p => {
            const b = getYearSafe(p.birth?.date) || getYearSafe(p.christening?.date);
            const d = getYearSafe(p.death?.date) || getYearSafe(p.burial?.date);
            if (!isNaN(b) && b < minYear && b > 1000) minYear = b;
            if (!isNaN(d) && d > maxYear && d <= 2026) maxYear = d;
        });
        if (minYear > maxYear) { minYear = 1700; maxYear = 2026; }
        return { min: Math.min(minYear, 1450), max: maxYear };
    }, [persons]);

    const [selectedYear, setSelectedYear] = useState<number>(yearsRange.max);
    const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
    const [filter, setFilter] = useState<string>('Alles');
    const activeRef = useRef<HTMLDivElement>(null);

    // Precompute birth/death years per person once
    const personYears = useMemo(() =>
        persons.persons.map(p => ({
            person: p,
            b: getYearSafe(p.birth?.date) || getYearSafe(p.christening?.date),
            d: getYearSafe(p.death?.date) || getYearSafe(p.burial?.date),
        })),
    [persons]);

    // Who was alive in a given year?
    const aliveIn = (year: number): { person: IPerson; age: number }[] =>
        personYears
            .filter(({ b, d }) => {
                if (isNaN(b)) return false;
                const alive = b <= year && (isNaN(d) ? (year - b < 105) : d >= year);
                return alive;
            })
            .map(({ person, b }) => ({ person, age: year - b }))
            .sort((a, b) => b.age - a.age);

    // Census for the slider year
    const censusData = useMemo(() => {
        const living = aliveIn(selectedYear);
        const births = personYears.filter(({ b }) => b === selectedYear).map(x => x.person);
        const deaths = personYears.filter(({ d }) => d === selectedYear).map(x => x.person);
        const activeEvents = HISTORICAL_EVENTS.filter(e => {
            const end = e.endYear ?? e.year;
            return selectedYear >= e.year && selectedYear <= end;
        });
        const avg = living.length > 0
            ? Math.round(living.reduce((s, x) => s + x.age, 0) / living.length)
            : 0;
        return { living, births, deaths, activeEvents, avg };
    }, [selectedYear, personYears]); // eslint-disable-line react-hooks/exhaustive-deps

    const categories = ['Alles', 'NL', 'Wereld', 'Religie', 'Wetenschap', 'Ramp', 'Oorlog'];

    const visibleEvents = useMemo(() =>
        HISTORICAL_EVENTS.filter(e =>
            e.year >= yearsRange.min &&
            (filter === 'Alles' || e.category === filter)
        ),
    [filter, yearsRange.min]);

    // Scroll active event into view when slider changes
    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [selectedYear]);

    const nearestEvent = visibleEvents.reduce<IHistoryEvent | null>((best, ev) => {
        if (!best) return ev;
        return Math.abs(ev.year - selectedYear) < Math.abs(best.year - selectedYear) ? ev : best;
    }, null);

    return (
        <div className="page-container" style={{ maxWidth: '1100px' }}>
            <h1 className="page-title">Tijdreis: Geschiedenis & Familie</h1>
            <p className="page-subtitle">
                Verschuif de tijdlijn om te zien welke historische gebeurtenissen plaatsvonden en wie van jouw voorouders daarbij leefden.
            </p>

            {/* Slider Card */}
            <div className="card" style={{ padding: '28px 30px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center', minWidth: '90px' }}>
                        <div style={{ fontSize: '42px', fontWeight: '900', color: 'var(--primary-color)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                            {selectedYear}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', marginTop: '4px' }}>
                            {censusData.living.length} levend
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <input
                            type="range"
                            min={yearsRange.min}
                            max={yearsRange.max}
                            value={selectedYear}
                            onChange={e => { setSelectedYear(parseInt(e.target.value, 10)); setExpandedEvent(null); }}
                            style={{ width: '100%', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', marginTop: '4px' }}>
                            <span>{yearsRange.min}</span>
                            <span>{yearsRange.max}</span>
                        </div>
                    </div>
                    {/* Quick stats */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {[
                            { label: 'Gem. leeftijd', value: `${censusData.avg} jr` },
                            { label: 'Geboren', value: censusData.births.length },
                            { label: 'Overleden', value: censusData.deaths.length },
                        ].map(s => (
                            <div key={s.label} style={{ textAlign: 'center', padding: '10px 16px', background: '#f8fafc', borderRadius: '12px', minWidth: '70px' }}>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>{s.value}</div>
                                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '2px' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active events banner */}
                {censusData.activeEvents.length > 0 && (
                    <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {censusData.activeEvents.map((ev, i) => {
                            const style = CATEGORY_STYLE[ev.category];
                            return (
                                <div key={i} style={{
                                    display: 'flex', gap: '8px', alignItems: 'center',
                                    padding: '8px 14px', borderRadius: '10px',
                                    backgroundColor: style.bg, border: `1px solid ${style.border}`,
                                }}>
                                    <span style={{ fontSize: '16px' }}>{ev.icon}</span>
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: '800', color: style.color }}>{ev.title}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{ev.year}{ev.endYear ? `–${ev.endYear}` : ''}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Category filter pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                {categories.map(cat => {
                    const isActive = filter === cat;
                    const style = cat === 'Alles' ? null : CATEGORY_STYLE[cat];
                    return (
                        <button key={cat} onClick={() => setFilter(cat)} style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            border: `1px solid ${isActive ? (style?.border || 'var(--primary-color)') : 'var(--border-color)'}`,
                            backgroundColor: isActive ? (style?.bg || 'var(--primary-color)') : 'white',
                            color: isActive ? (style?.color || 'white') : 'var(--text-secondary)',
                            fontWeight: '700',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all 0.15s',
                        }}>
                            {cat !== 'Alles' && <span style={{ marginRight: '4px' }}>{cat === 'NL' ? '🇳🇱' : cat === 'Wereld' ? '🌍' : cat === 'Religie' ? '✝️' : cat === 'Wetenschap' ? '🔬' : cat === 'Ramp' ? '⚠️' : '⚔️'}</span>}
                            {cat}
                        </button>
                    );
                })}
            </div>

            {/* Main two-column layout */}
            <div className="responsive-grid-sidebar" style={{ alignItems: 'start' }}>

                {/* LEFT: Historical Timeline */}
                <div style={{ position: 'relative' }}>
                    {/* Vertical line */}
                    <div style={{ position: 'absolute', left: '19px', top: 0, bottom: 0, width: '2px', backgroundColor: 'var(--border-color)', zIndex: 0 }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {visibleEvents.map((ev, idx) => {
                            const catStyle = CATEGORY_STYLE[ev.category];
                            const isNear = nearestEvent?.year === ev.year && nearestEvent?.title === ev.title;
                            const isExpanded = expandedEvent === idx;
                            const livingAtEvent = isExpanded ? aliveIn(ev.year) : [];

                            return (
                                <div
                                    key={idx}
                                    ref={isNear ? activeRef : undefined}
                                    style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', paddingBottom: '4px' }}
                                >
                                    {/* Timeline dot */}
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        flexShrink: 0,
                                        backgroundColor: isNear ? catStyle.bg : 'white',
                                        border: `2px solid ${isNear ? catStyle.border : 'var(--border-color)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '18px',
                                        zIndex: 1,
                                        boxShadow: isNear ? `0 0 0 3px ${catStyle.border}` : 'var(--shadow-sm)',
                                        transition: 'all 0.3s',
                                        cursor: 'pointer',
                                    }} onClick={() => { setExpandedEvent(isExpanded ? null : idx); setSelectedYear(ev.year); }}>
                                        {ev.icon}
                                    </div>

                                    {/* Event Card */}
                                    <div
                                        onClick={() => { setExpandedEvent(isExpanded ? null : idx); setSelectedYear(ev.year); }}
                                        style={{
                                            flex: 1,
                                            padding: '14px 18px',
                                            borderRadius: '12px',
                                            border: `1px solid ${isNear ? catStyle.border : 'var(--border-color)'}`,
                                            backgroundColor: isNear ? catStyle.bg : 'white',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            marginBottom: '8px',
                                            boxShadow: isNear ? `0 2px 12px rgba(0,0,0,0.06)` : 'none',
                                        }}
                                        onMouseEnter={e => { if (!isNear) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                                        onMouseLeave={e => { if (!isNear) e.currentTarget.style.backgroundColor = 'white'; }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800',
                                                        backgroundColor: catStyle.bg, color: catStyle.color, border: `1px solid ${catStyle.border}`,
                                                        textTransform: 'uppercase',
                                                    }}>
                                                        {ev.category}
                                                    </span>
                                                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-secondary)' }}>
                                                        {ev.year}{ev.endYear ? `–${ev.endYear}` : ''}
                                                    </span>
                                                </div>
                                                <h4 style={{ margin: '0 0 4px 0', fontWeight: '800', fontSize: '14px', color: isNear ? catStyle.color : 'var(--text-primary)' }}>
                                                    {ev.title}
                                                </h4>
                                                {isExpanded && (
                                                    <>
                                                        <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                                            {ev.description}
                                                        </p>
                                                        {livingAtEvent.length > 0 ? (
                                                            <div>
                                                                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                                                    {livingAtEvent.length} familielid{livingAtEvent.length > 1 ? 'en' : ''} leefde{livingAtEvent.length > 1 ? 'n' : ''} hierbij:
                                                                </div>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                                    {livingAtEvent.slice(0, 20).map(({ person, age }) => (
                                                                        <Link
                                                                            key={person.pointer}
                                                                            to={`/personen/${person.pointer}`}
                                                                            onClick={e => e.stopPropagation()}
                                                                            style={{
                                                                                padding: '4px 10px',
                                                                                borderRadius: '20px',
                                                                                fontSize: '11px',
                                                                                fontWeight: '700',
                                                                                textDecoration: 'none',
                                                                                backgroundColor: person.sex === 'M' ? 'rgba(59,130,246,0.08)' : person.sex === 'F' ? 'rgba(236,72,153,0.08)' : '#f1f5f9',
                                                                                color: person.sex === 'M' ? 'var(--male-color)' : person.sex === 'F' ? 'var(--female-color)' : 'var(--text-secondary)',
                                                                                border: '1px solid transparent',
                                                                            }}
                                                                        >
                                                                            {person.firstName} {person.lastName} <span style={{ opacity: 0.7 }}>({age} jr)</span>
                                                                        </Link>
                                                                    ))}
                                                                    {livingAtEvent.length > 20 && (
                                                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', padding: '4px 8px' }}>
                                                                            +{livingAtEvent.length - 20} meer
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
                                                                Geen bekende familieleden leefden in {ev.year}.
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0 }}>
                                                {isExpanded ? '▲' : '▼'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT: Living ancestors in selected year */}
                <div style={{ position: 'sticky', top: '20px' }}>
                    <div className="card" style={{ padding: '24px' }}>
                        <h3 style={{ margin: '0 0 4px 0', fontWeight: '800', fontSize: '15px' }}>
                            Levende familie in {selectedYear}
                        </h3>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '16px' }}>
                            Gesorteerd op leeftijd
                        </span>

                        {censusData.living.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
                                {censusData.living.map(({ person, age }) => (
                                    <div key={person.pointer} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        borderBottom: '1px solid #f1f5f9', paddingBottom: '8px',
                                    }}>
                                        <div>
                                            <Link to={`/personen/${person.pointer}`} style={{ fontSize: '13px', fontWeight: '700', textDecoration: 'none', color: 'var(--text-primary)' }}>
                                                {person.firstName} {person.lastName}
                                            </Link>
                                            <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary)' }}>
                                                *{getYearSafe(person.birth?.date) || getYearSafe(person.christening?.date) || '?'}
                                            </span>
                                        </div>
                                        <span style={{
                                            padding: '3px 9px', borderRadius: '10px', fontSize: '11px', fontWeight: '700',
                                            backgroundColor: age < 18 ? 'rgba(59,130,246,0.08)' : age > 70 ? '#fee2e2' : '#f1f5f9',
                                            color: age < 18 ? 'var(--male-color)' : age > 70 ? '#b91c1c' : 'var(--text-secondary)',
                                        }}>
                                            {age === 0 ? 'pasgeboren' : `${age} jr`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic', margin: 0 }}>
                                Geen bekende familieleden in {selectedYear}.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Timeline;
