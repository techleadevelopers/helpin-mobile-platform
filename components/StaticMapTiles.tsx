import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { getStaticMapUrl } from '@/services/zoohelpApi';

type StaticMapTilesProps = {
  latitude: number;
  longitude: number;
  zoom?: number;
  opacity?: number;
};

function lonToTileX(longitude: number, zoom: number) {
  return Math.floor(((longitude + 180) / 360) * 2 ** zoom);
}

function latToTileY(latitude: number, zoom: number) {
  const latRad = (latitude * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * 2 ** zoom,
  );
}

export function StaticMapTiles({
  latitude,
  longitude,
  zoom = 13,
  opacity = 1,
}: StaticMapTilesProps) {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [mapImageFailed, setMapImageFailed] = useState(false);
  const centerX = lonToTileX(longitude, zoom);
  const centerY = latToTileY(latitude, zoom);
  const tileSize = 180;

  useEffect(() => {
    let mounted = true;
    setMapUrl(null);
    setMapImageFailed(false);
    getStaticMapUrl({
      lat: latitude,
      lng: longitude,
      zoom,
      width: 640,
      height: 320,
    })
      .then((url) => {
        if (mounted) setMapUrl(url);
      })
      .catch(() => {
        if (mounted) setMapUrl(null);
      });

    return () => {
      mounted = false;
    };
  }, [latitude, longitude, zoom]);

  return (
    <View pointerEvents="none" style={[styles.container, { opacity }]}>
      <View style={styles.fallbackMap}>
        {[-1, 0, 1].flatMap((dx) =>
          [-1, 0, 1].map((dy) => {
            const x = centerX + dx;
            const y = centerY + dy;
            return (
              <Image
                key={`${x}-${y}`}
                source={{ uri: `https://a.basemaps.cartocdn.com/light_all/${zoom}/${x}/${y}@2x.png` }}
                style={[
                  styles.tile,
                  {
                    width: tileSize,
                    height: tileSize,
                    left: '50%',
                    top: '50%',
                    transform: [
                      { translateX: -tileSize / 2 + dx * tileSize },
                      { translateY: -tileSize / 2 + dy * tileSize },
                    ],
                  },
                ]}
                contentFit="cover"
              />
            );
          }),
        )}
      </View>

      {mapUrl && !mapImageFailed && (
        <Image
          source={{ uri: mapUrl }}
          style={styles.mapImage}
          contentFit="cover"
          transition={180}
          onError={() => setMapImageFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    backgroundColor: '#E9F2EA',
    zIndex: 0,
  },
  mapImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  fallbackMap: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#E7F0E8',
  },
  tile: {
    position: 'absolute',
  },
});
