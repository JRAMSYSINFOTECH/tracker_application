import { StyleSheet, View } from 'react-native';

export default function TopCurve() {
  return <View style={styles.topShape} />;
}

const styles = StyleSheet.create({
  topShape: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 240,
    height: 220,
    backgroundColor: '#f4c6f7',
    borderBottomRightRadius: 120,
  },
});