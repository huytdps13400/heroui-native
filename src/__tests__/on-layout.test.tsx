import { isValidElement, type ReactElement, type ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import Skeleton from '../components/skeleton/skeleton';
import Switch from '../components/switch/switch';
import Tabs from '../components/tabs/tabs';
import Toast from '../components/toast/toast';

/**
 * These components measure themselves through `onLayout`. Their hooks only
 * memoize values, read context or subscribe to effects, so they are stubbed to
 * run inline and the render functions can be invoked directly; the measuring
 * element is then looked up in the returned tree and its `onLayout` invoked.
 */
const mockContext: { current: Record<string, unknown> } = { current: {} };
const mockSetState = jest.fn();

jest.mock('react', () => {
  const actual = jest.requireActual('react');

  return {
    ...actual,
    useContext: () => mockContext.current,
    useMemo: (factory: () => unknown) => factory(),
    useCallback: (callback: unknown) => callback,
    useState: (initial: unknown) => [initial, mockSetState],
    useEffect: () => {},
  };
});

function mockSharedValue() {
  return { value: 0, get: () => 0, set: jest.fn(), modify: jest.fn() };
}

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: {
    View: 'Animated.View',
    createAnimatedComponent: (component: unknown) => component,
  },
  useSharedValue: () => mockSharedValue(),
  Easing: { linear: () => 0, bezier: () => () => 0 },
}));
jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: 'GestureDetector',
}));
jest.mock('../helpers/external/hooks', () => ({
  useThemeColor: () => ['#000', '#fff'],
}));
jest.mock('../helpers/internal/components', () => ({
  useHasDefaultThemeBackground: () => false,
  ThemeBackground: () => null,
}));
jest.mock('../components/button', () => ({ Button: () => null }));
jest.mock('../components/tabs/tabs.animation', () => ({}));
jest.mock('../components/switch/switch.animation', () => ({
  SwitchAnimationProvider: 'SwitchAnimationProvider',
  useSwitchRootAnimation: () => ({
    rContainerStyle: {},
    isSwitchPressed: mockSharedValue(),
    contentContainerWidth: mockContext.current.contentContainerWidth,
    isAllAnimationsDisabled: false,
  }),
}));
jest.mock('../components/skeleton/linear-gradient', () => () => null);
jest.mock('../components/skeleton/skeleton.animation', () => ({
  SkeletonAnimationProvider: 'SkeletonAnimationProvider',
  useSkeletonRootAnimation: () => ({
    isAllAnimationsDisabled: false,
    entering: undefined,
    exiting: undefined,
  }),
}));
jest.mock('../components/toast/toast.animation', () => ({
  useToastRootAnimation: () => ({
    rContainerStyle: {},
    entering: undefined,
    exiting: undefined,
    panGesture: {},
    isAllAnimationsDisabled: false,
  }),
}));
jest.mock('../components/toast/toast.hooks', () => ({
  useVerticalPlaceholderStyles: () => ({ topStyle: {}, bottomStyle: {} }),
}));
jest.mock('../providers/toast/toast-config.context', () => ({
  useToastConfig: () => undefined,
}));

type ElementProps = Record<string, any>;

/** Depth-first search for the first element whose props match `predicate`. */
function findElement(
  node: ReactNode,
  predicate: (props: ElementProps) => boolean
): ElementProps | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findElement(child, predicate);
      if (found) return found;
    }
    return undefined;
  }

  if (!isValidElement(node)) return undefined;

  const props = node.props as ElementProps;
  if (predicate(props)) return props;

  return findElement(props.children, predicate);
}

function render(Component: unknown, props: ElementProps): ReactElement {
  const { render: renderFn } = Component as {
    render?: (props: ElementProps, ref: null) => ReactElement;
  };

  return renderFn
    ? renderFn(props, null)
    : (Component as (props: ElementProps) => ReactElement)(props);
}

const layoutEvent = {
  nativeEvent: { layout: { x: 8, y: 0, width: 120, height: 40 } },
} as LayoutChangeEvent;

beforeEach(() => {
  mockSetState.mockClear();
});

describe('consumer onLayout', () => {
  it('Tabs.Trigger still measures the trigger', () => {
    const setMeasurements = jest.fn();
    const onLayout = jest.fn();
    mockContext.current = { value: 'a', setMeasurements };

    const trigger = findElement(
      render(Tabs.Trigger, { value: 'a', onLayout }),
      (props) => props.value === 'a'
    );
    trigger?.onLayout(layoutEvent);

    expect(onLayout).toHaveBeenCalledWith(layoutEvent);
    expect(setMeasurements).toHaveBeenCalledWith('a', {
      width: 120,
      height: 40,
      x: 8,
    });
  });

  it('Switch still measures its content container', () => {
    const contentContainerWidth = mockSharedValue();
    const onLayout = jest.fn();
    mockContext.current = { contentContainerWidth };

    const root = findElement(
      render(Switch, { isSelected: false, onLayout }),
      (props) => 'onSelectedChange' in props
    );
    root?.onLayout(layoutEvent);

    expect(onLayout).toHaveBeenCalledWith(layoutEvent);
    expect(contentContainerWidth.set).toHaveBeenCalledWith(120);
  });

  it('Skeleton still measures its width for the shimmer', () => {
    const onLayout = jest.fn();
    mockContext.current = {};

    const skeleton = findElement(render(Skeleton, { onLayout }), (props) =>
      props.className?.includes('skeleton')
    );
    skeleton?.onLayout(layoutEvent);

    expect(onLayout).toHaveBeenCalledWith(layoutEvent);
    expect(mockSetState).toHaveBeenCalledWith(120);
  });

  it('Toast still measures its height for stacking', () => {
    const heights = mockSharedValue();
    const onLayout = jest.fn();
    mockContext.current = {};

    const tree = render(Toast, { id: 't', heights, onLayout });
    const measuringInstance = findElement(tree, (props) =>
      props.className?.includes('opacity-0')
    );
    measuringInstance?.onLayout(layoutEvent);

    expect(heights.modify).toHaveBeenCalled();
    // The consumer handler stays on the visible toast instance
    expect(
      findElement(tree, (props) => props.onLayout === onLayout)
    ).toBeDefined();
  });
});
