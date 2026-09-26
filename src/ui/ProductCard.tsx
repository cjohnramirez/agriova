import { Package, Store } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { color, radius, space } from '@/theme/tokens';
import { Text } from './Text';

type ProductCardProps = {
  name: string;
  /** Already formatted, e.g. "₱4,200". */
  price: string;
  /** e.g. "per 18 kg bag". */
  per: string;
  seller: string;
  photoUri?: string | null;
  onPress: () => void;
};

/**
 * A marketplace listing, from the prototype's Shop grid: photo, name, price,
 * seller. Laid out two-up by the screen; the card itself only fills its column.
 */
export function ProductCard({ name, price, per, seller, photoUri, onPress }: ProductCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${price} ${per}, ${seller}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.photo}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Package size={40} color={color.textFaint} strokeWidth={1.5} />
        )}
      </View>
      <View style={styles.body}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {name}
        </Text>
        <Text variant="heading" tone="accent" numeric>
          {price}
        </Text>
        <Text tone="muted">{per}</Text>
        <View style={styles.seller}>
          <Store size={18} color={color.accent} strokeWidth={1.75} />
          <Text variant="label" tone="accent" style={styles.sellerName}>
            {seller}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: color.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.7 },
  photo: {
    aspectRatio: 4 / 3,
    backgroundColor: color.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: space.md, gap: space.xs },
  seller: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  sellerName: { flex: 1 },
});
