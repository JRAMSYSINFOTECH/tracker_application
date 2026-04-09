import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { spacing } from './spacing';

export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 34,
  },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  linkText: {
    fontSize: 15,
    color: colors.accent,
    fontWeight: '500',
  },
  pillInput: {
    height: spacing.inputHeight,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: spacing.pillRadius,
    paddingHorizontal: 18,
    fontSize: 17,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  primaryButton: {
    height: spacing.buttonHeight,
    backgroundColor: colors.softPink,
    borderRadius: spacing.pillRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  googleButton: {
    height: spacing.inputHeight,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: spacing.pillRadius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: colors.white,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1.2,
    backgroundColor: '#222',
  },
  orText: {
    marginHorizontal: 12,
    fontSize: 18,
    color: colors.textPrimary,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: -10,
    marginBottom: 12,
    marginLeft: 12,
  },
});