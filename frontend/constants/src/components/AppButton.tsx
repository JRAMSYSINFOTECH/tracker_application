import { Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { commonStyles } from '../theme/commonStyles';

type Props = {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export default function AppButton({ title, onPress, style, textStyle }: Props) {
  return (
    <TouchableOpacity style={[commonStyles.primaryButton, style]} onPress={onPress}>
      <Text style={[commonStyles.primaryButtonText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}