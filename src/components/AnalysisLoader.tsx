import { useState, useEffect, useRef } from 'react';

interface AnalysisLoaderProps {
  businessData?: {
    name?: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  };
  onComplete: () => void;
  isAnalyzing?: boolean; // Add this to track if analysis is still running
  serviceRadiusMiles?: number; // Adapt map rings to selected service radius
}

const analysisSteps = [
  "Scanning local search opportunities",
  "Analyzing keyword competition", 
  "Checking Google Business rankings",
  "Evaluating service area coverage",
  "Calculating missed lead potential",
  "Benchmarking against competitors",
  "Assessing SEO optimization gaps",
  "Mapping local market dynamics",
  "Identifying content opportunities",
  "Generating growth recommendations"
];

// Map component for showing business location and service area
interface MapProps {
  businessData?: {
    name?: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  };
  serviceRadiusMiles?: number;
}

function ServiceAreaMap({ businessData, serviceRadiusMiles }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  // Derived ring set, reused by fallback and map
  const r = serviceRadiusMiles || 25;
  const ringMiles: [number, number, number] = r <= 22 ? [15, 25, 35] : r <= 37 ? [20, 30, 45] : [30, 45, 60];

  useEffect(() => {
    console.log('ServiceAreaMap: businessData received:', businessData);
    
    if (!mapRef.current) {
      console.log('ServiceAreaMap: Missing mapRef');
      return;
    }

    // Use business coordinates if available, otherwise default to Milwaukee
    const defaultCoords = { lat: 43.0389, lng: -87.9065 }; // Milwaukee
    const coords = businessData?.coordinates || defaultCoords;
    console.log('ServiceAreaMap: Using coordinates:', coords);

    // Validate coordinates before using them
    const { lat, lng } = coords;
    console.log('ServiceAreaMap: Final coordinates to use:', { lat, lng });
    
    if (typeof lat !== 'number' || typeof lng !== 'number' || 
        !isFinite(lat) || !isFinite(lng) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error('Invalid coordinates:', coords);
      return;
    }

    // Wait for Google Maps API to be available
    const initMap = () => {
      console.log('ServiceAreaMap: Checking Google Maps API availability...');
      if (!window.google?.maps) {
        console.log('ServiceAreaMap: Google Maps API not loaded, retrying...');
        // Google Maps not loaded yet, try again in a moment
        setTimeout(initMap, 100);
        return;
      }

      try {
        console.log('ServiceAreaMap: Google Maps API available, creating map...');
        const validCoords = { lat, lng };
        
        const map = new window.google.maps.Map(mapRef.current!, {
          center: validCoords,
          zoom: 11,
          styles: [
            // Subtle gray theme for professional look
            {
              "featureType": "all",
              "elementType": "geometry.fill",
              "stylers": [{ "color": "#f5f5f5" }]
            },
            {
              "featureType": "road",
              "elementType": "geometry",
              "stylers": [{ "color": "#ffffff" }]
            },
            {
              "featureType": "water",
              "elementType": "geometry.fill",
              "stylers": [{ "color": "#e3f2fd" }]
            }
          ],
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });

        // Add business marker (only if we have real business data)
        if (businessData?.coordinates) {
          new window.google.maps.Marker({
            position: validCoords,
            map: map,
            title: businessData.name || 'Business Location',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ef4444"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(32, 32),
              anchor: new window.google.maps.Point(16, 32)
            }
          });
        }

        // Add service area circles based on selected service radius
        const milesToMeters = (m: number) => m * 1609.34;
        const serviceRadii = [
          { radius: milesToMeters(ringMiles[0]), color: '#0040ff', opacity: 0.15 },
          { radius: milesToMeters(ringMiles[1]), color: '#0040ff', opacity: 0.1 },
          { radius: milesToMeters(ringMiles[2]), color: '#0040ff', opacity: 0.06 },
        ];

        // Keep a reference to the largest circle so we can fitBounds to it
        let outerCircle: any = null;
        serviceRadii.forEach(({ radius, color, opacity }) => {
          const circle = new window.google.maps.Circle({
            strokeColor: color,
            strokeOpacity: 0.4,
            strokeWeight: 1,
            fillColor: color,
            fillOpacity: opacity,
            map: map,
            center: validCoords,
            radius: radius // meters
          });
          outerCircle = circle; // last one is the largest
        });

        // Default view: frame the full outer service ring with padding
        try {
          if (outerCircle && typeof outerCircle.getBounds === 'function') {
            const bounds = outerCircle.getBounds();
            // @ts-ignore - allow object padding for fitBounds
            map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
          }
        } catch {}

        console.log('ServiceAreaMap: Map and markers created successfully');
        setMapLoaded(true);
      } catch (error) {
        console.error('ServiceAreaMap: Error initializing map:', error);
        // If Google Maps fails, we'll show the fallback UI
        setMapLoaded(false);
      }
    };

    initMap();
  }, [businessData?.coordinates, businessData?.name, serviceRadiusMiles]);

  // Always show the map container

  return (
    <div className="relative h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-paper to-white flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="w-24 h-24 bg-brand rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">🗺️</span>
            </div>
            {businessData?.name ? (
              <>
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                  {businessData.name}
                </h3>
                <p className="text-gray-600 mb-4">{businessData.city}</p>
                <div className="text-sm text-gray-500 space-y-1">
                  <div>Service Area Analysis</div>
                  <div>{ringMiles[0]}-{ringMiles[2]} Mile Radius Coverage</div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                  Wisconsin Market Analysis
                </h3>
                <div className="text-sm text-gray-500 space-y-1">
                  <div>Milwaukee Metro Area</div>
                  <div>Service Territory Mapping</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalysisLoader({ businessData, onComplete, isAnalyzing = true, serviceRadiusMiles }: AnalysisLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(analysisSteps[0]);

  useEffect(() => {
    // Rotate through analysis messages every 2 seconds
    const messageInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % analysisSteps.length);
    }, 2000);

    // Progress that actually waits for analysis to complete
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        // If analysis is complete, quickly finish to 100%
        if (!isAnalyzing) {
          if (prev >= 95) {
            clearInterval(progressInterval);
            setTimeout(onComplete, 500);
            return 100;
          }
          // Fast completion when analysis is done
          return Math.min(prev + 8, 100);
        }

        // While analyzing, advance but never exceed 95% and freeze there
        if (prev >= 95) return 95;
        let next = prev;
        if (prev < 60) {
          next = prev + 2; // Normal speed first 60%
        } else if (prev < 80) {
          next = prev + 0.8; // Slower 60-80%
        } else if (prev < 90) {
          next = prev + 0.3; // Very slow 80-90%
        } else {
          next = prev + 0.1; // Crawling speed above 90% until analysis completes
        }
        return Math.min(next, 95);
      });
    }, 500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete, isAnalyzing]);

  useEffect(() => {
    setCurrentMessage(analysisSteps[currentStep]);
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-white">
      {/* Responsive Layout - Stacked on mobile, side-by-side on desktop */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 h-screen">
        {/* Top on mobile / Left on desktop - Map */}
        <div className="relative h-[300px] lg:h-full">
          <ServiceAreaMap businessData={businessData} serviceRadiusMiles={serviceRadiusMiles} />
        </div>

        {/* Bottom on mobile / Right on desktop - Content */}
        <div className="flex-1 flex flex-col justify-center items-center bg-white px-4 lg:px-0 pt-4 lg:pt-0">
          {/* Progress Circle */}
          <div className="relative w-32 h-32 mb-6">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              {(() => {
                const safe = Math.max(0, Math.min(100, progress));
                const circumference = 2 * Math.PI * 50;
                const offset = circumference * (1 - safe / 100);
                return (
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#0040ff"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-500 ease-out"
                    strokeLinecap="round"
                  />
                );
              })()}
            </svg>
            {/* Progress percentage */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-ink">{Math.round(Math.max(0, Math.min(100, progress)))}%</span>
            </div>
          </div>

          {/* Main Headline - Bold and Large */}
          <div className="text-center mb-4">
            <h1 className="text-4xl lg:text-5xl font-big-shoulders uppercase font-extrabold text-ink leading-tight tracking-tight">
              MAPPING YOUR LOCAL<br />
              PIPELINE POTENTIAL
            </h1>
          </div>

          {/* Current Analysis Step */}
          <div className="text-center mb-8">
            <p className="text-lg text-ink/70 transition-all duration-500">
              {progress >= 95 ? 'Finalizing…' : currentMessage}
            </p>
          </div>

          {/* Professional touch - Bottom */}
          <div className="absolute bottom-8 text-center">
            <p className="text-xs text-ink/50 font-medium">
              Powered by Floorplay™ Search Intelligence Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
