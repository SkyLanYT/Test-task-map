import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const containerStyle = {
  width: '100%',
  height: '700px',
};

const center = {
  lat: 48.3794,
  lng: 31.1656,
};

const MemoizedGoogleMap = React.memo(GoogleMap);

const MapComponent: React.FC = () => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyB1LZeJGZgjtpyRqEx0Cv7RGgFnJMYEqQI',
  });

  const [markers, setMarkers] = useState<{ id: string, lat: number, lng: number, label: string }[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerClustererRef = useRef<MarkerClusterer | null>(null);

  const handleRemoveMarker = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'markers', id));
    setMarkers(prevMarkers => prevMarkers.filter(marker => marker.id !== id));
  }, []);

  useEffect(() => {
    const fetchMarkers = async () => {
      const markersCollection = collection(db, 'markers');
      const markerSnapshot = await getDocs(markersCollection);
      const markerList = markerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as { id: string, lat: number, lng: number, label: string }[];
      console.log('Fetched markers:', markerList);
      setMarkers(markerList);
    };

    fetchMarkers();
  }, []);

  useEffect(() => {
    if (mapRef.current && isLoaded) {
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
      } else {
        markerClustererRef.current = new MarkerClusterer({ map: mapRef.current });
      }

      const googleMarkers = markers.map((marker) => {
        const googleMarker = new google.maps.Marker({
          position: { lat: marker.lat, lng: marker.lng },
          label: marker.label,
          map: mapRef.current,
        });

        googleMarker.addListener('rightclick', () => handleRemoveMarker(marker.id));
        return googleMarker;
      });

      markerClustererRef.current.addMarkers(googleMarkers);
      console.log('Markers added to clusterer:', googleMarkers);
    }
  }, [markers, isLoaded, handleRemoveMarker]);

  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    const newMarker = {
      lat: event.latLng?.lat() || center.lat,
      lng: event.latLng?.lng() || center.lng,
      label: (markers.length + 1).toString(),
    };
    const docRef = await addDoc(collection(db, 'markers'), newMarker);
    setMarkers([...markers, { id: docRef.id, ...newMarker }]);
  };

  return isLoaded ? (
    <div className="map-container">
      <MemoizedGoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={7}
        onLoad={map => {
          mapRef.current = map;
        }}
        onClick={handleMapClick}
      />
    </div>
  ) : <div>Loading...</div>;
};

export default MapComponent;
