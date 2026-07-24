import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'h3'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'link'
    | 'linkPrimary'
    | 'caption'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'h3' && styles.h3,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'caption' && styles.caption,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.bodyMedium,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.bodyBold,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.bodyRegular,
  },
  title: {
    fontSize: 34,
    fontFamily: Fonts.displayBold,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 20,
    fontFamily: Fonts.displaySemiBold,
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 26,
    fontFamily: Fonts.displaySemiBold,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
    fontFamily: Fonts.bodyMedium,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    fontFamily: Fonts.bodyBold,
    color: '#FF4500',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: Fonts.bodyBold,
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 14,
  },
});
