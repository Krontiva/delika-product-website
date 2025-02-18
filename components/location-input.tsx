import React, { useState, useEffect, useRef } from 'react';
import { LocationData } from '@/components/location';

interface LocationInputProps {
    label: string;
    onLocationSelect: (location: LocationData) => void;
    prefillData?: LocationData;
    disabled?: boolean;
}

interface GooglePlace {
    description: string;
    place_id: string;
}

let isScriptLoaded = false;
let scriptPromise: Promise<void> | null = null;

const loadGoogleMapsScript = () => {
    if (isScriptLoaded) return Promise.resolve();
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise((resolve, reject) => {
        if (window.google?.maps) {
            isScriptLoaded = true;
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyAdv28EbwKXqvlKo2henxsKMD-4EKB20l8&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            isScriptLoaded = true;
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });

    return scriptPromise;
};

const LocationInput: React.FC<LocationInputProps> = ({ label, onLocationSelect, prefillData, disabled }) => {
    const [address, setAddress] = useState(prefillData?.address || '');
    const [suggestions, setSuggestions] = useState<GooglePlace[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
    const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (prefillData) {
            setAddress(prefillData.address);
            onLocationSelect(prefillData);
        }
    }, [prefillData, onLocationSelect]);

    useEffect(() => {
        loadGoogleMapsScript().then(() => {
            // Wait for google object to be available
            const initServices = () => {
                if (!window.google || !window.google.maps || !window.google.maps.places) {
                    setTimeout(initServices, 100);
                    return;
                }

                if (!mapRef.current) {
                    console.error('Map div not found');
                    return;
                }

                try {
                    setAutocompleteService(new window.google.maps.places.AutocompleteService());
                    const mapDiv = mapRef.current;
                    const map = new window.google.maps.Map(mapDiv, {
                        center: { lat: 5.6037, lng: -0.1870 }, // Accra coordinates
                        zoom: 13,
                        disableDefaultUI: true
                    });
                    setPlacesService(new window.google.maps.places.PlacesService(map));
                } catch (error) {
                    console.error('Error initializing Google Maps services:', error);
                }
            };

            initServices();
        }).catch(error => {
            console.error('Error loading Google Maps:', error);
        });
    }, []);

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setAddress(value);

        if (value.length > 2 && autocompleteService) {
            try {
                const request = {
                    input: value,
                    componentRestrictions: { country: 'gh' },
                    location: new google.maps.LatLng(5.6037, -0.1870), // Accra coordinates
                    radius: 50000 // 50km radius
                };

                autocompleteService.getPlacePredictions(request, (predictions, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                        setSuggestions(predictions);
                        setShowSuggestions(true);
                    }
                });
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelect = (place: GooglePlace) => {
        if (placesService) {
            placesService.getDetails(
                { placeId: place.place_id },
                (result, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && result) {
                        const locationData: LocationData = {
                            longitude: result.geometry?.location?.lng() || 0,
                            latitude: result.geometry?.location?.lat() || 0,
                            name: result.name || '',
                            address: result.formatted_address || '',
                            city: result.address_components?.find(component => component.types.includes('administrative_area_level_2'))?.long_name || ''
                        };

                        setAddress(result.formatted_address || '');
                        setSuggestions([]);
                        setShowSuggestions(false);
                        onLocationSelect(locationData);
                    }
                }
            );
        }
    };

    return (
        <div className="w-full" style={{ width: '100%' }} ref={wrapperRef}>
            <div ref={mapRef} style={{ display: 'none' }}></div>
            <label className="block text-[14px] leading-[22px] font-sans text-black mb-2">{label}</label>
            <div className="relative w-full" style={{ width: '100%' }}>
                <input
                    placeholder={`Enter ${label.toLowerCase()} location`}
                    value={address}
                    onChange={handleInputChange}
                    disabled={disabled}
                    style={{ width: '100%' }}
                    className={`font-sans w-full border-[#efefef] border-[1px] border-solid [outline:none]
                    text-[13px] bg-[#fff] rounded-[8px]
                    py-[14px] px-[20px]
                    text-[#201a18] placeholder:text-[#b1b4b3]
                    box-border ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                />

                {showSuggestions && suggestions.length > 0 && (
                    <div className="font-sans absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg"
                        style={{ width: '100%' }}>
                        {suggestions.map((suggestion, index) => (
                            <div
                                key={index}
                                className="font-sans px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                onClick={() => handleSelect(suggestion)}
                            >
                                {suggestion.description}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocationInput;