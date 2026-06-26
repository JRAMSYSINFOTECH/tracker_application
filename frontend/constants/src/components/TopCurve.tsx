import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

type TopCurveProps = {
  color?: string;
  style?: ViewStyle;
};

export default function TopCurve({ color = colors.topShape, style }: TopCurveProps) {
  return <View style={[styles.topShape, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  topShape: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 240,
    height: 220,
    borderBottomRightRadius: 120,
  },
});