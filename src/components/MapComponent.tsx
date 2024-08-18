import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
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

  const handleMarkerDragEnd = useCallback(async (id: string, position: google.maps.LatLng) => {
    const updatedMarker = {
      lat: position.lat(),
      lng: position.lng(),
    };
    await updateDoc(doc(db, 'markers', id), updatedMarker);
    setMarkers(prevMarkers =>
      prevMarkers.map(marker => (marker.id === id ? { ...marker, ...updatedMarker } : marker))
    );
  }, []);

  const handleClearAllMarkers = async () => {
    const markerCollection = collection(db, 'markers');
    const markerSnapshot = await getDocs(markerCollection);
    const batch = markerSnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(batch);
    setMarkers([]);
  };

  useEffect(() => {
    const fetchMarkers = async () => {
      const markersCollection = collection(db, 'markers');
      const markerSnapshot = await getDocs(markersCollection);
      const markerList = markerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as { id: string, lat: number, lng: number, label: string }[];
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
          draggable: true,
        });

        googleMarker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            handleMarkerDragEnd(marker.id, event.latLng);
          }
        });

        googleMarker.addListener('click', () => handleRemoveMarker(marker.id));
        
        return googleMarker;
      });

      markerClustererRef.current.addMarkers(googleMarkers);
    }
  }, [markers, isLoaded, handleRemoveMarker, handleMarkerDragEnd]);

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
      <button onClick={handleClearAllMarkers} style={{ marginBottom: '10px' }}>Delete All Markers</button>
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
  ) : null;  
};

export default MapComponent;
