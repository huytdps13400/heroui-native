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
  useAnimatedStyle: (factory: () => unknown) => ({ get: factory }),
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

jest.mock('../helpers/internal/hooks', () => ({
  useCombinedAnimationDisabledState: () => false,
}));

// The hook only calls the stubbed hooks above, so it is safe to call it as a
// plain function outside a component.
const runScrollShadowAnimation = useScrollShadowRootAnimation;

type StyleGetter = { get: () => { opacity: number } };

/**
 * Opacities of both shadows for a list scrolled to the very top whose content
 * (1000) overflows the container (500).
 */
function getOpacitiesAtTop(visibility: ScrollShadowVisibility) {
  const result = runScrollShadowAnimation({
    animation: undefined,
    orientation: 'vertical',
    size: 50,
    visibility,
    isEnabled: true,
  });

  result.contentSize.set(1000);
  result.containerSize.set(500);
  result.scrollOffset.set(0);

  return {
    top: (result.topShadowStyle as unknown as StyleGetter).get().opacity,
    bottom: (result.bottomShadowStyle as unknown as StyleGetter).get().opacity,
  };
}

describe('ScrollShadow visibility', () => {
  it('"auto" hides the top shadow at the start of the list', () => {
    expect(getOpacitiesAtTop('auto')).toEqual({ top: 0, bottom: 1 });
  });

  it('"both" always shows both shadows', () => {
    expect(getOpacitiesAtTop('both')).toEqual({ top: 1, bottom: 1 });
  });
});
