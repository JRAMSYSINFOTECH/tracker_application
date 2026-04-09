import { TextInput, TextInputProps } from 'react-native';
import { commonStyles } from '../theme/commonStyles';

type Props = TextInputProps & {
  style?: any;
};

export default function AppInput({ style, ...props }: Props) {
  return (
    <TextInput
      {...props}
      style={[commonStyles.pillInput, style]}
      placeholderTextColor="#666"
    />
  );
}