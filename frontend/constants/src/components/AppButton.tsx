import {
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { commonStyles } from '../theme/commonStyles';

type Props = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export default function AppButton({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
}: Props) {
  return (
    <TouchableOpacity
      style={[commonStyles.primaryButton, disabled && { opacity: 0.65 }, style]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[commonStyles.primaryButtonText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}
