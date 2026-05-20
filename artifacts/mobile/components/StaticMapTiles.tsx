import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

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
  const centerX = lonToTileX(longitude, zoom);
  const centerY = latToTileY(latitude, zoom);
  const tileSize = 180;

  return (
    <View pointerEvents="none" style={[styles.container, { opacity }]}>
      {[-1, 0, 1].flatMap((dx) =>
        [-1, 0, 1].map((dy) => {
          const x = centerX + dx;
          const y = centerY + dy;
          return (
            <Image
              key={`${x}-${y}`}
              source={{ uri: `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png` }}
              style={[
                styles.tile,
                {
                  width: tileSize,
                  height: tileSize,
                  left: `50%`,
                  top: `50%`,
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
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#E9F2EA',
    zIndex: 0,
  },
  tile: {
    position: 'absolute',
  },
});
