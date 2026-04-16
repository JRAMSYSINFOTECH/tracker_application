import { StyleSheet, TextInput, View } from 'react-native';

export default function AppInput({ style, ...props }: any) {
  return (
    <View style={[styles.container, style]}>
      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor="#777"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 55,
    borderWidth: 2,
    borderColor: '#111',
    borderRadius: 30,
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: '#fff',
  },
  input: {
    fontSize: 16,
    color: '#111',
  },
});