import React from 'react';
import {
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { commonStyles } from '../theme/commonStyles';

type Props = {
  title: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
};

export default function AppButton({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
}: Props) {
  return (
    <TouchableOpacity
      style={[commonStyles.primaryButton, style, disabled && { opacity: 0.7 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[commonStyles.primaryButtonText, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}