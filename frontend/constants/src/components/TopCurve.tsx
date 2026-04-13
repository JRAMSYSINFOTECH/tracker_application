import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

export default function TopCurve() {
  return <View style={styles.topShape} />;
}

const styles = StyleSheet.create({
  topShape: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 240,
    height: 230,
    backgroundColor: colors.topShape,
    borderBottomRightRadius: 150,
    opacity: 0.8,
  },
});