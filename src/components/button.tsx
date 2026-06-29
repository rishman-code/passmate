import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === 'primary'
      ? theme.primary
      : variant === 'danger'
        ? theme.error
        : variant === 'secondary'
          ? theme.backgroundElement
          : 'transparent';

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? '#FFFFFF'
      : variant === 'outline'
        ? theme.primary
        : theme.text;

  return (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.button,
        fullWidth && styles.fullWidth,
        {
          backgroundColor,
          borderColor: variant === 'outline' ? theme.primary : backgroundColor,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        typeof style === 'function' ? style({ pressed, hovered }) : style,
      ]}
      disabled={isDisabled}
      {...props}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <ThemedText style={[styles.label, { color: textColor }]}>{title}</ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
