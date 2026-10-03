import { useScrollShadowRootAnimation } from '../components/scroll-shadow/scroll-shadow.animation';
import type { ScrollShadowVisibility } from '../components/scroll-shadow/scroll-shadow.types';

/**
 * Reanimated hooks are stubbed so the derived opacity worklets run synchronously
 * and the resulting animated styles can be read directly.
 */
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  Extrapolation: { CLAMP: 'clamp' },
  interpolate: (
    value: number,
    [inMin, inMax]: [number, number],
    [outMin, outMax]: [number, number]
  ) => {
    const progress = Math.min(
      Math.max((value - inMin) / (inMax - inMin), 0),
      1
    );
    return outMin + (outMax - outMin) * progress;
  },
  useAnimatedScrollHandler: () => () => {},
  useAnimatedStyle: (factory: () => unknown) => factory(),
  useDerivedValue: (factory: () => unknown) => ({ get: factory }),
  useSharedValue: (initial: number) => {
    let value = initial;
    return {
      get: () => value,
      set: (next: number) => {
        value = next;
      },
    };
  },
  withTiming: (toValue: number) => toValue,
}));

let mockIsAllAnimationsDisabled = false;

jest.mock('../helpers/internal/hooks', () => ({
  useCombinedAnimationDisabledState: () => mockIsAllAnimationsDisabled,
}));

// The hook only calls the stubbed hooks above, so it is safe to call it as a
// plain function outside a component.
const runScrollShadowAnimation = useScrollShadowRootAnimation;

function getOpacities(options: {
  visibility: ScrollShadowVisibility;
  isEnabled?: boolean;
  animation?: 'disabled';
}) {
  const { topShadowStyle, bottomShadowStyle } = runScrollShadowAnimation({
    animation: options.animation,
    orientation: 'vertical',
    size: 50,
    visibility: options.visibility,
    isEnabled: options.isEnabled ?? true,
  }) as unknown as {
    topShadowStyle: { opacity: number };
    bottomShadowStyle: { opacity: number };
  };

  return {
    top: topShadowStyle.opacity,
    bottom: bottomShadowStyle.opacity,
  };
}

describe('ScrollShadow with animations enabled', () => {
  it('hides shadows according to isEnabled and visibility', () => {
    expect(getOpacities({ visibility: 'auto', isEnabled: false })).toEqual({
      top: 0,
      bottom: 0,
    });
    expect(getOpacities({ visibility: 'none' })).toEqual({ top: 0, bottom: 0 });
  });
});

describe('ScrollShadow with animations disabled', () => {
  afterEach(() => {
    mockIsAllAnimationsDisabled = false;
  });

  it('hides both shadows when isEnabled is false (animation="disabled")', () => {
    expect(
      getOpacities({
        visibility: 'auto',
        isEnabled: false,
        animation: 'disabled',
      })
    ).toEqual({ top: 0, bottom: 0 });
  });

  it('hides both shadows when visibility is "none" (animation="disabled")', () => {
    expect(getOpacities({ visibility: 'none', animation: 'disabled' })).toEqual(
      { top: 0, bottom: 0 }
    );
  });

  it('only shows the requested edge (animation="disabled")', () => {
    expect(getOpacities({ visibility: 'top', animation: 'disabled' })).toEqual({
      top: 1,
      bottom: 0,
    });
    expect(
      getOpacities({ visibility: 'bottom', animation: 'disabled' })
    ).toEqual({ top: 0, bottom: 1 });
  });

  it('respects visibility when all animations are disabled globally (Reduce Motion)', () => {
    mockIsAllAnimationsDisabled = true;

    expect(getOpacities({ visibility: 'none' })).toEqual({ top: 0, bottom: 0 });
    expect(getOpacities({ visibility: 'auto', isEnabled: false })).toEqual({
      top: 0,
      bottom: 0,
    });
  });
});
