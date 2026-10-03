import type { ReactElement } from 'react';
import Avatar from '../components/avatar/avatar';
import type { AvatarFallbackProps } from '../components/avatar/avatar.types';
import FieldError from '../components/field-error/field-error';
import type { FieldErrorRootProps } from '../components/field-error/field-error.types';

/**
 * FieldError and Avatar.Fallback only read context and animation hooks, which are
 * stubbed here so their `forwardRef` render functions can be invoked directly.
 */
jest.mock('react-native-reanimated', () => {
  const Animated = {
    View: 'Animated.View',
    Text: 'Animated.Text',
    createAnimatedComponent: (component: unknown) => component,
  };
  return { __esModule: true, default: Animated, ...Animated };
});

jest.mock('uniwind', () => ({
  __esModule: true,
  useCSSVariable: () => undefined,
  useUniwind: () => ({ theme: 'light' }),
  withUniwind: (component: unknown) => component,
}));

jest.mock('../helpers/internal/components', () => ({
  HeroText: 'HeroText',
  ThemeBackground: () => null,
  useHasDefaultThemeBackground: () => false,
}));

jest.mock('../helpers/internal/contexts', () => ({
  ...jest.requireActual('../helpers/internal/contexts'),
  useFormField: () => undefined,
}));

jest.mock('../components/field-error/field-error.constants', () => ({
  DISPLAY_NAME: { ROOT: 'HeroUINative.FieldError.Root' },
}));

jest.mock('../components/field-error/field-error.animation', () => ({
  useFieldErrorRootAnimation: () => ({}),
}));

jest.mock('../components/avatar/avatar.context', () => ({
  ...jest.requireActual('../components/avatar/avatar.context'),
  useInnerAvatarContext: () => ({ size: 'md', color: 'accent' }),
}));

jest.mock('../components/avatar/avatar.animation', () => ({
  useAvatarFallbackAnimation: () => ({}),
  useAvatarImageAnimation: () => ({}),
  useAvatarRootAnimation: () => ({}),
}));

type RenderFn<P> = { render: (props: P, ref: null) => ReactElement };

function getTextClassName(element: ReactElement): string {
  const text = (element.props as { children: ReactElement }).children;
  return (text.props as { className: string }).className;
}

describe('textProps.className is merged with the base text classes', () => {
  it('FieldError keeps its base text class', () => {
    const { render } = FieldError as unknown as RenderFn<FieldErrorRootProps>;
    const className = getTextClassName(
      render(
        {
          isInvalid: true,
          textProps: { className: 'tracking-wide' },
          children: 'Required',
        },
        null
      )
    );

    expect(className).toContain('field-error__text');
    expect(className).toContain('tracking-wide');
  });

  it('Avatar.Fallback keeps its base text classes', () => {
    const { render } =
      Avatar.Fallback as unknown as RenderFn<AvatarFallbackProps>;
    const className = getTextClassName(
      render(
        { textProps: { className: 'tracking-wide' }, children: 'JD' },
        null
      )
    );

    expect(className).toContain('avatar__fallback-text');
    expect(className).toContain('avatar__fallback-text--size-md');
    expect(className).toContain('avatar__fallback-text--color-accent');
    expect(className).toContain('tracking-wide');
  });
});
