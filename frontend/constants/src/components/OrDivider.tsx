import { Text, View } from 'react-native';
import { commonStyles } from '../theme/commonStyles';

export default function OrDivider() {
  return (
    <View style={commonStyles.orRow}>
      <View style={commonStyles.dividerLine} />
      <Text style={commonStyles.orText}>Or</Text>
      <View style={commonStyles.dividerLine} />
    </View>
  );
}