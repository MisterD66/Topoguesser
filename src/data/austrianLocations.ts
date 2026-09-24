/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlpineLocation } from '../types/game';
import { getCalculatedPeaks, getCartographicElevation } from '../utils/terrainElevation';

export const AUSTRIAN_LOCATIONS: AlpineLocation[] = [
  {
    id: 'grossglockner-fjhoehe',
    name: 'Kaiser-Franz-Josefs-Höhe',
    subname: 'Großglockner & Pasterze Glacier',
    mountainRange: 'Glocknergruppe · Hohe Tauern',
    bundesland: 'Kärnten',
    observerPos: { lat: 47.0754, lng: 12.7512 },
    observerElevation: 2369,
    initialHeading: 260, // Facing West toward Großglockner
    description: 'Panoramic terrace situated high above the Pasterze glacier, directly facing Austria\'s highest summit and the Glocknerwand.',
    funFact: 'Großglockner is Austria’s highest peak at 3,798m. Emperor Franz Joseph I stood here in 1856 with Empress Elisabeth (Sisi).',
    targetPeak: {
      id: 'grossglockner',
      name: 'Großglockner',
      elevation: 3798,
      lat: 47.0742,
      lng: 12.6947,
      prominence: 2428,
      hasSummitCross: true,
    },
    nearbyPeaks: [
      { id: 'glocknerwand', name: 'Glocknerwand', elevation: 3721, lat: 47.081, lng: 12.686 },
      { id: 'johannisberg', name: 'Johannisberg', elevation: 3453, lat: 47.112, lng: 12.691 },
      { id: 'fuscherkarkopf', name: 'Fuscherkarkopf', elevation: 3331, lat: 47.098, lng: 12.748 },
      { id: 'spielmann', name: 'Spielmann', elevation: 3027, lat: 47.092, lng: 12.798 },
      { id: 'schareck', name: 'Schareck', elevation: 3123, lat: 47.042, lng: 12.871 },
      { id: 'sonnblick', name: 'Hoher Sonnblick', elevation: 3106, lat: 47.054, lng: 12.955 }
    ],
    landmarks: [
      { name: 'Glocknerhaus Hütte', type: 'alpine_hut', lat: 47.078, lng: 12.775, elevation: 2132 },
      { name: 'Oberwalderhütte', type: 'alpine_hut', lat: 47.108, lng: 12.715, elevation: 2972 },
      { name: 'Erzherzog-Johann-Hütte', type: 'alpine_hut', lat: 47.072, lng: 12.701, elevation: 3454 },
      { name: 'Pasterzenboden', type: 'glacier', lat: 47.085, lng: 12.719, elevation: 2150 }
    ],
    bounds: {
      minLat: 47.02,
      maxLat: 47.13,
      minLng: 12.64,
      maxLng: 12.86
    },
    mapCenterOffsetKm: { x: -3.8, y: 1.5 }, // Observer is in the Southeast of the regional map
    elevationFeatures: {
      baseAlt: 2100,
      noiseScale: 140,
      peaks: [
        { dx: -4.3, dy: -0.15, alt: 3798, radius: 2.8, ridgeAngle: 0.35, ridgeLength: 3.5 }, // Großglockner
        { dx: -5.0, dy: 0.7, alt: 3721, radius: 2.2, ridgeAngle: 0.6, ridgeLength: 2.8 },   // Glocknerwand
        { dx: -4.5, dy: 4.1, alt: 3453, radius: 2.5, ridgeAngle: 1.1, ridgeLength: 2.5 },   // Johannisberg
        { dx: -0.2, dy: 2.5, alt: 3331, radius: 2.0, ridgeAngle: 0.2, ridgeLength: 2.0 },   // Fuscherkarkopf
        { dx: 3.5, dy: 1.8, alt: 3027, radius: 2.2 },                                       // Spielmann
        { dx: 0, dy: 0, alt: 2369, radius: 1.4 }                                             // Observation terrace
      ],
      valleys: [
        { x1: -4.5, y1: 3.5, x2: 0.5, y2: -1.5, depth: 450, width: 1.4 } // Pasterze glacier tongue trough
      ]
    }
  },
  {
    id: 'hoher-dachstein',
    name: 'Krippenstein / Welterbeblick',
    subname: 'Hoher Dachstein & Hallstätter See',
    mountainRange: 'Dachsteingebirge · Salzkammergut',
    bundesland: 'Oberösterreich',
    observerPos: { lat: 47.5244, lng: 13.6922 },
    observerElevation: 2108,
    initialHeading: 245, // Facing SW towards Hoher Dachstein
    description: 'High limestone plateau viewpoint overlooking the glaciated North Face of Hoher Dachstein and the deep fjord of Hallstätter See.',
    funFact: 'The Dachstein south face drops vertically for 850m. Hallstatt below was home to the world\'s oldest salt mine dating back 7,000 years.',
    targetPeak: {
      id: 'hoherdachstein',
      name: 'Hoher Dachstein',
      elevation: 2995,
      lat: 47.4753,
      lng: 13.6058,
      prominence: 2136,
      hasSummitCross: true,
    },
    nearbyPeaks: [
      { id: 'torstein', name: 'Torstein', elevation: 2948, lat: 47.467, lng: 13.585 },
      { id: 'mitterspitz', name: 'Mitterspitz', elevation: 2925, lat: 47.471, lng: 13.595 },
      { id: 'taubenkogel', name: 'Taubenkogel', elevation: 2057, lat: 47.533, lng: 13.670 },
      { id: 'plassen', name: 'Plassen', elevation: 1953, lat: 47.575, lng: 13.628 },
      { id: 'sarstein', name: 'Hoher Sarstein', elevation: 1975, lat: 47.601, lng: 13.702 }
    ],
    landmarks: [
      { name: 'Simonyhütte', type: 'alpine_hut', lat: 47.498, lng: 13.632, elevation: 2203 },
      { name: 'Lodge am Krippenstein', type: 'alpine_hut', lat: 47.525, lng: 13.693, elevation: 2060 },
      { name: 'Hallstätter See', type: 'lake', lat: 47.578, lng: 13.662, elevation: 508 },
      { name: 'Hallstätter Gletscher', type: 'glacier', lat: 47.485, lng: 13.620, elevation: 2600 }
    ],
    bounds: {
      minLat: 47.45,
      maxLat: 47.62,
      minLng: 13.55,
      maxLng: 13.78
    },
    mapCenterOffsetKm: { x: -4.5, y: -2.8 },
    lakeElevation: 508,
    lakeName: 'Hallstätter See',
    elevationFeatures: {
      baseAlt: 1600,
      noiseScale: 160,
      peaks: [
        { dx: -6.5, dy: -5.4, alt: 2995, radius: 3.2, ridgeAngle: 0.8, ridgeLength: 4.0 }, // Hoher Dachstein
        { dx: -8.0, dy: -6.2, alt: 2948, radius: 2.5 },                                     // Torstein
        { dx: 0, dy: 0, alt: 2108, radius: 1.5 },                                           // Krippenstein summit
        { dx: -4.8, dy: 5.6, alt: 1953, radius: 2.2 },                                      // Plassen
        { dx: 0.8, dy: 8.5, alt: 1975, radius: 2.8, ridgeAngle: 1.4, ridgeLength: 3.5 }     // Hoher Sarstein
      ],
      valleys: [
        { x1: -2.3, y1: 3.5, x2: -2.3, y2: 9.0, depth: 1200, width: 1.8 } // Hallstatt lake trough
      ],
      lakes: [
        { cx: -2.3, cy: 6.0, rx: 1.3, ry: 4.2, waterAlt: 508 }
      ]
    }
  },
  {
    id: 'wilder-kaiser',
    name: 'Gruttenhütte Panoramaterrasse',
    subname: 'Wilder Kaiser & Ellmauer Halt',
    mountainRange: 'Kaisergebirge',
    bundesland: 'Tirol',
    observerPos: { lat: 47.5581, lng: 12.3150 },
    observerElevation: 1620,
    initialHeading: 350, // Facing North straight into the Kaiser crags
    description: 'Rugged high-altitude refuge perched directly underneath the towering vertical limestone walls of Ellmauer Halt and Treffauer.',
    funFact: 'The Wilder Kaiser is legendary in mountaineering history; famous free solo routes like the "Fleischbank" were pioneered here.',
    targetPeak: {
      id: 'ellmauerhalt',
      name: 'Ellmauer Halt',
      elevation: 2344,
      lat: 47.5614,
      lng: 12.3028,
      prominence: 1551,
      hasSummitCross: true,
    },
    nearbyPeaks: [
      { id: 'treffauer', name: 'Treffauer', elevation: 2304, lat: 47.553, lng: 12.285 },
      { id: 'karlspitzen', name: 'Hintere Karlspitze', elevation: 2281, lat: 47.569, lng: 12.326 },
      { id: 'scheffauer', name: 'Scheffauer', elevation: 2111, lat: 47.551, lng: 12.247 },
      { id: 'hartkaiser', name: 'Hartkaiser', elevation: 1555, lat: 47.498, lng: 12.298 },
      { id: 'hohesalve', name: 'Hohe Salve', elevation: 1828, lat: 47.464, lng: 12.203 }
    ],
    landmarks: [
      { name: 'Gruttenhütte', type: 'alpine_hut', lat: 47.558, lng: 12.315, elevation: 1620 },
      { name: 'Gaudeamushütte', type: 'alpine_hut', lat: 47.551, lng: 12.339, elevation: 1263 },
      { name: 'Hintersteiner See', type: 'lake', lat: 47.542, lng: 12.215, elevation: 882 }
    ],
    bounds: {
      minLat: 47.49,
      maxLat: 47.61,
      minLng: 12.20,
      maxLng: 12.38
    },
    mapCenterOffsetKm: { x: 1.2, y: 3.8 },
    elevationFeatures: {
      baseAlt: 1000,
      noiseScale: 180,
      peaks: [
        { dx: -0.9, dy: 0.4, alt: 2344, radius: 1.6, ridgeAngle: 0.1, ridgeLength: 2.2 }, // Ellmauer Halt
        { dx: -2.3, dy: -0.6, alt: 2304, radius: 1.5 },                                    // Treffauer
        { dx: 0.9, dy: 1.2, alt: 2281, radius: 1.6 },                                     // Karlspitze
        { dx: -5.2, dy: -0.8, alt: 2111, radius: 2.0 },                                    // Scheffauer
        { dx: -1.3, dy: -6.7, alt: 1555, radius: 2.4 },                                    // Hartkaiser
        { dx: 0, dy: 0, alt: 1620, radius: 0.8 }
      ],
      valleys: [
        { x1: -6.0, y1: -4.0, x2: 4.0, y2: -4.0, depth: 400, width: 2.5 } // Ellmau valley basin
      ]
    }
  },
  {
    id: 'schafberg-salzkammergut',
    name: 'Schafbergspitze Gipfelplateau',
    subname: 'Schafberg & Wolfgangsee 7-Lakes Panorama',
    mountainRange: 'Salzkammergut Berge',
    bundesland: 'Salzburg',
    observerPos: { lat: 47.7761, lng: 13.4331 },
    observerElevation: 1783,
    initialHeading: 160, // Facing SSE towards Wolfgangsee and Dachstein horizon
    description: 'Steep limestone horn rising abruptly over 1,200m from lake level, offering Austria\'s most iconic 360-degree panorama of seven alpine lakes.',
    funFact: 'The historic Schafberg Cog Railway (opened in 1893) is the steepest steam rack railway in Austria, climbing 1,190m in 35 minutes.',
    targetPeak: {
      id: 'schafberg',
      name: 'Schafberg',
      elevation: 1783,
      lat: 47.7761,
      lng: 13.4331,
      prominence: 1183,
      hasSummitCross: true,
    },
    nearbyPeaks: [
      { id: 'schober', name: 'Schober', elevation: 1328, lat: 47.801, lng: 13.315 },
      { id: 'drachenwand', name: 'Drachenwand', elevation: 1176, lat: 47.818, lng: 13.352 },
      { id: 'hoellengebirge', name: 'Großer Höllkogel', elevation: 1862, lat: 47.815, lng: 13.662 },
      { id: 'zwoelferhorn', name: 'Zwölferhorn', elevation: 1522, lat: 47.728, lng: 13.359 },
      { id: 'bleckwand', name: 'Bleckwand', elevation: 1541, lat: 47.731, lng: 13.479 }
    ],
    landmarks: [
      { name: 'Hotel Schafbergspitze', type: 'alpine_hut', lat: 47.776, lng: 13.433, elevation: 1780 },
      { name: 'Wolfgangsee', type: 'lake', lat: 47.742, lng: 13.415, elevation: 538 },
      { name: 'Mondsee', type: 'lake', lat: 47.822, lng: 13.398, elevation: 481 },
      { name: 'Attersee', type: 'lake', lat: 47.835, lng: 13.515, elevation: 469 }
    ],
    bounds: {
      minLat: 47.71,
      maxLat: 47.86,
      minLng: 13.32,
      maxLng: 13.58
    },
    mapCenterOffsetKm: { x: 2.2, y: -3.5 },
    lakeElevation: 538,
    lakeName: 'Wolfgangsee',
    elevationFeatures: {
      baseAlt: 650,
      noiseScale: 110,
      peaks: [
        { dx: 0, dy: 0, alt: 1783, radius: 2.1, ridgeAngle: 1.8, ridgeLength: 3.2 }, // Schafberg
        { dx: -5.6, dy: -5.3, alt: 1522, radius: 2.6 },                             // Zwölferhorn
        { dx: 3.5, dy: -5.0, alt: 1541, radius: 2.4 },                              // Bleckwand
        { dx: -6.1, dy: 4.8, alt: 1176, radius: 1.8, ridgeAngle: 0.6, ridgeLength: 2.4 } // Drachenwand
      ],
      lakes: [
        { cx: -1.4, cy: -3.8, rx: 2.6, ry: 4.5, waterAlt: 538 }, // Wolfgangsee
        { cx: -2.8, cy: 5.2, rx: 3.2, ry: 2.4, waterAlt: 481 }   // Mondsee
      ]
    }
  },
  {
    id: 'kitzsteinhorn-top',
    name: 'Top of Salzburg Viewpoint (3,029m)',
    subname: 'Kitzsteinhorn & Zeller See',
    mountainRange: 'Glocknergruppe · Hohe Tauern',
    bundesland: 'Salzburg',
    observerPos: { lat: 47.2039, lng: 12.6865 },
    observerElevation: 3029,
    initialHeading: 25, // Facing NNE toward Zeller See and Steinernes Meer
    description: 'High-alpine viewing platform projecting out over the sheer north slope, overlooking the azure mirror of Lake Zell and the limestone ramparts of Steinernes Meer.',
    funFact: 'The Top of Salzburg platform features the Nationalpark Gallery tunnel blasted directly through the summit pyramid of Kitzsteinhorn.',
    targetPeak: {
      id: 'kitzsteinhorn',
      name: 'Kitzsteinhorn',
      elevation: 3203,
      lat: 47.1997,
      lng: 12.6908,
      prominence: 439,
      hasSummitCross: true,
    },
    nearbyPeaks: [
      { id: 'wiesbachhorn', name: 'Großes Wiesbachhorn', elevation: 3564, lat: 47.158, lng: 12.756 },
      { id: 'hohedock', name: 'Hohe Dock', elevation: 3348, lat: 47.142, lng: 12.729 },
      { id: 'imbsbachhorn', name: 'Imbachhorn', elevation: 2470, lat: 47.241, lng: 12.752 },
      { id: 'schmittenhoehe', name: 'Schmittenhöhe', elevation: 1965, lat: 47.330, lng: 12.738 },
      { id: 'hundstein', name: 'Hundstein', elevation: 2117, lat: 47.340, lng: 12.905 }
    ],
    landmarks: [
      { name: 'Krefelder Hütte', type: 'alpine_hut', lat: 47.218, lng: 12.701, elevation: 2295 },
      { name: 'Alpincenter', type: 'alpine_hut', lat: 47.211, lng: 12.692, elevation: 2450 },
      { name: 'Zeller See', type: 'lake', lat: 47.322, lng: 12.802, elevation: 750 }
    ],
    bounds: {
      minLat: 47.13,
      maxLat: 47.36,
      minLng: 12.60,
      maxLng: 12.92
    },
    mapCenterOffsetKm: { x: 0.8, y: 5.2 },
    lakeElevation: 750,
    lakeName: 'Zeller See',
    elevationFeatures: {
      baseAlt: 1500,
      noiseScale: 175,
      peaks: [
        { dx: 0.3, dy: -0.5, alt: 3203, radius: 1.8, ridgeAngle: 0.4, ridgeLength: 2.5 }, // Kitzsteinhorn
        { dx: 5.3, dy: -5.1, alt: 3564, radius: 3.5, ridgeAngle: 1.2, ridgeLength: 4.2 }, // Wiesbachhorn
        { dx: 3.3, dy: -6.9, alt: 3348, radius: 2.8 },                                     // Hohe Dock
        { dx: 4.9, dy: 4.1, alt: 2470, radius: 2.2 },                                      // Imbachhorn
        { dx: 3.9, dy: 14.1, alt: 1965, radius: 3.0 }                                      // Schmittenhöhe
      ],
      valleys: [
        { x1: 0, y1: 1.0, x2: 8.0, y2: 15.0, depth: 1400, width: 2.8 } // Kaprun valley to Zell am See
      ],
      lakes: [
        { cx: 8.8, cy: 13.2, rx: 1.6, ry: 3.8, waterAlt: 750 } // Zeller See
      ]
    }
  },
  {
    id: 'patscherkofel-innsbruck',
    name: 'Patscherkofel Haus Panorama',
    subname: 'Innsbruck, Inntal & Karwendel Nordkette',
    mountainRange: 'Tuxer Alpen · Karwendel',
    bundesland: 'Tirol',
    observerPos: { lat: 47.2089, lng: 11.4608 },
    observerElevation: 1965,
    initialHeading: 345, // Facing North across Inntal directly towards Nordkette
    description: 'Famous rounded Olympic peak overlooking the provincial capital of Innsbruck and the sheer 2,300m rock wall of the Nordkette.',
    funFact: 'Patscherkofel hosted the Men\'s Downhill in both the 1964 and 1976 Winter Olympic Games, won by Austrian legend Franz Klammer in 1976.',
    targetPeak: {
      id: 'patscherkofel',
      name: 'Patscherkofel',
      elevation: 2246,
      lat: 47.2089,
      lng: 11.4608,
      prominence: 400,
      hasSummitCross: true,
    },
    nearbyPeaks: [
      { id: 'hafelekar', name: 'Hafelekarspitze', elevation: 2334, lat: 47.312, lng: 11.383 },
      { id: 'serles', name: 'Serles (Altar of Tyrol)', elevation: 2717, lat: 47.126, lng: 11.381 },
      { id: 'bettelwurf', name: 'Großer Bettelwurf', elevation: 2726, lat: 47.342, lng: 11.518 },
      { id: 'glungezer', name: 'Glungezer', elevation: 2677, lat: 47.208, lng: 11.522 },
      { id: 'hohemunde', name: 'Hohe Munde', elevation: 2662, lat: 47.348, lng: 11.074 }
    ],
    landmarks: [
      { name: 'Patscherkofelhaus', type: 'alpine_hut', lat: 47.214, lng: 11.458, elevation: 1965 },
      { name: 'Innsbruck Altstadt', type: 'valley', lat: 47.268, lng: 11.393, elevation: 574 },
      { name: 'Hafelekarhaus', type: 'alpine_hut', lat: 47.311, lng: 11.385, elevation: 2269 }
    ],
    bounds: {
      minLat: 47.10,
      maxLat: 47.36,
      minLng: 11.32,
      maxLng: 11.58
    },
    mapCenterOffsetKm: { x: -3.8, y: 3.2 },
    elevationFeatures: {
      baseAlt: 900,
      noiseScale: 140,
      peaks: [
        { dx: 0, dy: 0, alt: 2246, radius: 2.8 },                                           // Patscherkofel
        { dx: 4.6, dy: 0, alt: 2677, radius: 2.5, ridgeAngle: 1.5, ridgeLength: 3.5 },     // Glungezer
        { dx: -5.9, dy: -9.2, alt: 2717, radius: 2.4 },                                    // Serles
        { dx: -5.9, dy: 11.5, alt: 2334, radius: 2.8, ridgeAngle: 0.9, ridgeLength: 6.0 }, // Nordkette / Hafelekar
        { dx: 4.3, dy: 14.8, alt: 2726, radius: 3.0 }                                      // Bettelwurf
      ],
      valleys: [
        { x1: -12.0, y1: 6.5, x2: 12.0, y2: 6.5, depth: 1200, width: 3.5 } // Broad Inntal valley trough (574m)
      ]
    }
  },
  {
    id: 'traunstein-salzkammergut',
    name: 'Gmundner Hütte am Traunstein',
    subname: 'Traunstein & Traunsee Fjord',
    mountainRange: 'Oberösterreichische Voralpen',
    bundesland: 'Oberösterreich',
    observerPos: { lat: 47.8722, lng: 13.8406 },
    observerElevation: 1666,
    initialHeading: 280, // Facing West over Traunsee
    description: 'Towering solitary limestone monolith rising sheer 1,270m straight out of the deep waters of Traunsee.',
    funFact: 'Referred to by locals as "Wächter des Salzkammerguts" (Guardian of the Salzkammergut), Traunsee is Austria\'s deepest lake at 191m.',
    targetPeak: {
      id: 'traunstein',
      name: 'Traunstein',
      elevation: 1691,
      lat: 47.8722,
      lng: 13.8406,
      prominence: 1083,
      hasSummitCross: true,
    },
    nearbyPeaks: [
      { id: 'katzenstein', name: 'Katzenstein', elevation: 1349, lat: 47.859, lng: 13.858 },
      { id: 'erlakogel', name: 'Erlakogel', elevation: 1575, lat: 47.828, lng: 13.811 },
      { id: 'feuerkogel', name: 'Feuerkogel', elevation: 1592, lat: 47.818, lng: 13.722 },
      { id: 'gruenberg', name: 'Grünberg', elevation: 984, lat: 47.898, lng: 13.822 }
    ],
    landmarks: [
      { name: 'Gmundner Hütte', type: 'alpine_hut', lat: 47.872, lng: 13.841, elevation: 1666 },
      { name: 'Traunsee', type: 'lake', lat: 47.865, lng: 13.785, elevation: 422 },
      { name: 'Schloss Ort', type: 'valley', lat: 47.911, lng: 13.791, elevation: 425 }
    ],
    bounds: {
      minLat: 47.78,
      maxLat: 47.94,
      minLng: 13.70,
      maxLng: 13.92
    },
    mapCenterOffsetKm: { x: -3.2, y: 1.5 },
    lakeElevation: 422,
    lakeName: 'Traunsee',
    elevationFeatures: {
      baseAlt: 550,
      noiseScale: 130,
      peaks: [
        { dx: 0, dy: 0, alt: 1691, radius: 1.8, ridgeAngle: 0.2, ridgeLength: 2.2 }, // Traunstein
        { dx: 1.3, dy: -1.5, alt: 1349, radius: 1.4 },                               // Katzenstein
        { dx: -2.2, dy: -4.9, alt: 1575, radius: 2.0 },                              // Erlakogel
        { dx: -8.8, dy: -6.0, alt: 1592, radius: 3.2 }                               // Feuerkogel
      ],
      lakes: [
        { cx: -4.2, cy: -0.8, rx: 2.4, ry: 6.8, waterAlt: 422 } // Traunsee
      ]
    }
  },
  {
    id: 'schneeberg-klosterwappen',
    name: 'Damböckhaus & Fischerhütte',
    subname: 'Schneeberg (Klosterwappen 2,076m)',
    mountainRange: 'Rax-Schneeberg-Gruppe',
    bundesland: 'Niederösterreich',
    observerPos: { lat: 47.7672, lng: 15.8058 },
    observerElevation: 1810,
    initialHeading: 220, // Facing SW towards Rax and Höllental gorge
    description: 'Easternmost 2,000-meter peak of the Alps, whose prominent limestone dome can be seen from Vienna and the Hungarian plains.',
    funFact: 'Since 1873, the Vienna First Spring Water Main brings crystalline alpine water from the Schneeberg and Rax directly into the city of Vienna.',
    targetPeak: {
      id: 'klosterwappen',
      name: 'Klosterwappen',
      elevation: 2076,
      lat: 47.7672,
      lng: 15.8058,
      prominence: 1348,
      hasSummitCross: true,
    },
    nearbyPeaks: [
      { id: 'kaiserstein', name: 'Kaiserstein', elevation: 2061, lat: 47.771, lng: 15.811 },
      { id: 'heukuppe', name: 'Rax (Heukuppe)', elevation: 2007, lat: 47.689, lng: 15.698 },
      { id: 'jakobskogel', name: 'Jakobskogel', elevation: 1737, lat: 47.712, lng: 15.751 },
      { id: 'schneealpe', name: 'Schneealpe', elevation: 1903, lat: 47.701, lng: 15.599 }
    ],
    landmarks: [
      { name: 'Fischerhütte', type: 'alpine_hut', lat: 47.770, lng: 15.810, elevation: 2049 },
      { name: 'Damböckhaus', type: 'alpine_hut', lat: 47.755, lng: 15.828, elevation: 1810 },
      { name: 'Höllental', type: 'valley', lat: 47.730, lng: 15.760, elevation: 750 }
    ],
    bounds: {
      minLat: 47.66,
      maxLat: 47.84,
      minLng: 15.65,
      maxLng: 15.92
    },
    mapCenterOffsetKm: { x: -4.2, y: -3.6 },
    elevationFeatures: {
      baseAlt: 1050,
      noiseScale: 110,
      peaks: [
        { dx: 0, dy: 0, alt: 2076, radius: 3.5, ridgeAngle: 0.5, ridgeLength: 3.0 }, // Schneeberg
        { dx: -8.1, dy: -8.7, alt: 2007, radius: 4.0, ridgeAngle: 1.1, ridgeLength: 4.5 } // Rax
      ],
      valleys: [
        { x1: -4.0, y1: -4.0, x2: 2.0, y2: -7.0, depth: 850, width: 1.6 } // Deep Höllental canyon
      ]
    }
  },
  {
    id: 'piz-buin-vorarlberg',
    name: 'Bielerhöhe & Silvrettasee',
    subname: 'Piz Buin (3,312m)',
    mountainRange: 'Silvretta Gruppe',
    bundesland: 'Vorarlberg',
    observerPos: { lat: 46.9189, lng: 10.0931 },
    observerElevation: 2037,
    initialHeading: 175, // Facing South towards Piz Buin and Ochsentaler glacier
    description: 'High alpine reservoir pass connecting Vorarlberg and Tyrol, directly looking south into the heavily glaciated summits of the Silvretta.',
    funFact: 'Piz Buin is the highest mountain in Vorarlberg at 3,312m. The world-famous sunscreen brand Piz Buin was named after this very peak by its chemist inventor in 1938.',
    targetPeak: {
      id: 'pizbuin',
      name: 'Piz Buin',
      elevation: 3312,
      lat: 46.8444,
      lng: 10.1189,
      prominence: 544,
      hasSummitCross: true,
    },
    nearbyPeaks: [
      { id: 'silvrettahorn', name: 'Silvrettahorn', elevation: 3244, lat: 46.858, lng: 10.082 },
      { id: 'signalhorn', name: 'Signalhorn', elevation: 3207, lat: 46.848, lng: 10.096 },
      { id: 'hohesrad', name: 'Hohes Rad', elevation: 2934, lat: 46.896, lng: 10.111 },
      { id: 'vallucla', name: 'Vallüla', elevation: 2813, lat: 46.938, lng: 10.072 }
    ],
    landmarks: [
      { name: 'Silvretta-Stausee', type: 'lake', lat: 46.915, lng: 10.091, elevation: 2030 },
      { name: 'Wiesbadener Hütte', type: 'alpine_hut', lat: 46.871, lng: 10.118, elevation: 2443 },
      { name: 'Madlenerhaus', type: 'alpine_hut', lat: 46.917, lng: 10.098, elevation: 1986 }
    ],
    bounds: {
      minLat: 46.82,
      maxLat: 46.96,
      minLng: 10.02,
      maxLng: 10.18
    },
    mapCenterOffsetKm: { x: 0.8, y: -4.8 },
    lakeElevation: 2030,
    lakeName: 'Silvretta-Stausee',
    elevationFeatures: {
      baseAlt: 1850,
      noiseScale: 150,
      peaks: [
        { dx: 1.9, dy: -8.3, alt: 3312, radius: 2.5, ridgeAngle: 0.3, ridgeLength: 3.0 }, // Piz Buin
        { dx: -0.8, dy: -6.7, alt: 3244, radius: 2.2 },                                    // Silvrettahorn
        { dx: 1.3, dy: -2.5, alt: 2934, radius: 2.0 },                                     // Hohes Rad
        { dx: -1.6, dy: 2.1, alt: 2813, radius: 2.1 },                                     // Vallüla
        { dx: 0, dy: 0, alt: 2037, radius: 1.2 }
      ],
      lakes: [
        { cx: -0.2, cy: -0.4, rx: 1.2, ry: 2.0, waterAlt: 2030 } // Silvrettasee
      ]
    }
  },
  {
    id: 'grimming-steiermark',
    name: 'Schloss Trautenfels Terrassenblick',
    subname: 'Grimming Monolith (2,351m)',
    mountainRange: 'Dachsteingebirge',
    bundesland: 'Steiermark',
    observerPos: { lat: 47.5186, lng: 14.0722 },
    observerElevation: 673,
    initialHeading: 305, // Facing NW directly up the towering Grimming wall
    description: 'Towering solitary limestone massif that abruptly rises over 1,700 meters from the flat Ennstal valley floor, dominating the Styrian horizon.',
    funFact: 'Grimming was long considered "Mons Styriae altissimus" (the highest mountain in Styria) because of its solitary massiveness, before Dachstein was measured.',
    targetPeak: {
      id: 'grimming',
      name: 'Grimming',
      elevation: 2351,
      lat: 47.5206,
      lng: 14.0189,
      prominence: 1518,
      hasSummitCross: true,
    },
    nearbyPeaks: [
      { id: 'schartenspitze', name: 'Schartenspitze', elevation: 2328, lat: 47.526, lng: 14.025 },
      { id: 'kammspitze', name: 'Kammspitze', elevation: 2139, lat: 47.468, lng: 13.905 },
      { id: 'stoderzinken', name: 'Stoderzinken', elevation: 2048, lat: 47.461, lng: 13.829 },
      { id: 'bosruck', name: 'Bosruck', elevation: 1992, lat: 47.618, lng: 14.351 }
    ],
    landmarks: [
      { name: 'Grimminghütte', type: 'alpine_hut', lat: 47.511, lng: 14.041, elevation: 966 },
      { name: 'Schloss Trautenfels', type: 'valley', lat: 47.518, lng: 14.072, elevation: 673 },
      { name: 'Enns Fluss', type: 'valley', lat: 47.515, lng: 14.080, elevation: 640 }
    ],
    bounds: {
      minLat: 47.45,
      maxLat: 47.59,
      minLng: 13.92,
      maxLng: 14.15
    },
    mapCenterOffsetKm: { x: -4.5, y: 0.2 },
    elevationFeatures: {
      baseAlt: 650,
      noiseScale: 130,
      peaks: [
        { dx: -4.0, dy: 0.2, alt: 2351, radius: 2.8, ridgeAngle: 1.2, ridgeLength: 4.0 }, // Grimming
        { dx: -12.5, dy: -5.6, alt: 2139, radius: 2.6 },                                   // Kammspitze
        { dx: 0, dy: 0, alt: 673, radius: 1.0 }
      ],
      valleys: [
        { x1: -8.0, y1: -3.0, x2: 6.0, y2: 1.0, depth: 200, width: 2.5 } // Broad Ennstal valley
      ]
    }
  },
  {
    id: 'grossvenediger-salzburg',
    name: 'Kürsingerhütte / Obersulzbachtal',
    subname: 'Großvenediger & Obersulzbachkees',
    mountainRange: 'Venedigergruppe · Hohe Tauern',
    bundesland: 'Salzburg',
    observerPos: { lat: 47.1350, lng: 12.3022 },
    observerElevation: 2558,
    initialHeading: 145, // Facing SE towards the glistening glacier dome of Großvenediger
    description: 'High glacier refuge terrace overlooking the vast crevassed ice dome of the Großvenediger ("Die weltalte Majestät").',
    funFact: 'According to legend, on an exceptionally clear day, the summit of Großvenediger allows one to glimpse Venice (Venedig) over 200km away on the Adriatic.',
    targetPeak: {
      id: 'grossvenediger',
      name: 'Großvenediger',
      elevation: 3657,
      lat: 47.1092,
      lng: 12.3461,
      prominence: 1199,
      hasSummitCross: true,
    },
    nearbyPeaks: [
      { id: 'grosseriger', name: 'Großer Geiger', elevation: 3360, lat: 47.094, lng: 12.311 },
      { id: 'kleinvenediger', name: 'Kleinvenediger', elevation: 3471, lat: 47.121, lng: 12.355 },
      { id: 'rainerhorn', name: 'Rainerhorn', elevation: 3559, lat: 47.102, lng: 12.368 },
      { id: 'schwabenspitze', name: 'Schwalbenkopf', elevation: 2955, lat: 47.142, lng: 12.285 }
    ],
    landmarks: [
      { name: 'Kürsingerhütte', type: 'alpine_hut', lat: 47.135, lng: 12.302, elevation: 2558 },
      { name: 'Defreggerhaus', type: 'alpine_hut', lat: 47.085, lng: 12.362, elevation: 2962 },
      { name: 'Obersulzbachkees', type: 'glacier', lat: 47.120, lng: 12.325, elevation: 2650 }
    ],
    bounds: {
      minLat: 47.05,
      maxLat: 47.18,
      minLng: 12.22,
      maxLng: 12.42
    },
    mapCenterOffsetKm: { x: 3.5, y: -2.8 },
    elevationFeatures: {
      baseAlt: 2200,
      noiseScale: 160,
      peaks: [
        { dx: 3.3, dy: -2.9, alt: 3657, radius: 3.2, ridgeAngle: 0.8, ridgeLength: 3.8 }, // Großvenediger
        { dx: 0.7, dy: -4.5, alt: 3360, radius: 2.2 },                                     // Großer Geiger
        { dx: 4.1, dy: -1.5, alt: 3471, radius: 1.8 },                                     // Kleinvenediger
        { dx: 5.0, dy: -3.7, alt: 3559, radius: 2.0 },                                     // Rainerhorn
        { dx: 0, dy: 0, alt: 2558, radius: 1.2 }
      ],
      valleys: [
        { x1: -4.0, y1: 5.0, x2: 1.0, y2: 0, depth: 700, width: 1.6 } // Obersulzbachtal
      ]
    }
  }
];

/**
 * High-precision cartographic elevation evaluator for an AlpineLocation.
 * Calculates terrain altitude in meters at relative kilometer offset (xKm, yKm) from observer.
 * Perfectly synchronized with real OSM peak coordinates, heights and bearings.
 * xKm = East (+) / West (-)
 * yKm = North (+) / South (-)
 */
export function getElevationAt(location: AlpineLocation, xKm: number, yKm: number): number {
  const peaks = getCalculatedPeaks(location);
  return getCartographicElevation(location, xKm, yKm, peaks);
}
