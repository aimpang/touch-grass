import { useState, useEffect, useRef } from 'react';
import { getIPLocation } from './useIPLocation';

// Last resort fallback — center of continental US
const FALLBACK_LOCATION = { lat: 39.8283, lng: -98.5795 };

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [city, setCity] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTeleported, setIsTeleported] = useState(false);
  const homeLocation = useRef(null);
  const homeCity = useRef(null);

  useEffect(() => {
    async function fallbackToIP() {
      const ip = await getIPLocation();
      if (ip) {
        setLocation({ lat: ip.lat, lng: ip.lng });
        setCity(ip.city);
        homeLocation.current = { lat: ip.lat, lng: ip.lng };
        homeCity.current = ip.city;
        setError('Using approximate location');
      } else {
        setLocation(FALLBACK_LOCATION);
        homeLocation.current = FALLBACK_LOCATION;
        setCity(null);
        setError('Could not detect location');
      }
      setLoading(false);
    }

    if (!navigator.geolocation) {
      fallbackToIP();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });
        homeLocation.current = { lat, lng };
        setLoading(false);
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`)
          .then((r) => r.json())
          .then((data) => {
            const name = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality;
            if (name) { setCity(name); homeCity.current = name; }
          })
          .catch(() => {});
      },
      () => {
        fallbackToIP();
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  const teleport = (lat, lng, cityName) => {
    setLocation({ lat, lng });
    setCity(cityName || null);
    setIsTeleported(true);
    setError(null);
  };

  const goHome = () => {
    if (homeLocation.current) {
      setLocation({ ...homeLocation.current });
      setCity(homeCity.current);
      setIsTeleported(false);
      setError(null);
    }
  };

  return { location, city, error, loading, teleport, goHome, isTeleported, homeLocation: homeLocation.current };
}
