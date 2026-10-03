import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import SubMenu from '../components/sub-menu/sub-menu';

/**
 * SubMenu only reads the Menu / SubMenu roots through context and registers
 * effects, so its render functions can be invoked directly once those hooks
 * are stubbed: `useContext` returns the context under test, `useMemo` runs its
 * factory, effects are skipped and the root container reports itself as already mounted (its
 * mount flag is the only `useState` it holds).
 */
const mockContext: Record<string, unknown> = {
  presentation: 'popover',
  isOpen: false,
  onOpenChange: () => {},
  nativeID: 'sub-menu',
  openSubMenuId: null,
  openSubMenu: () => {},
  closeSubMenu: () => {},
};

jest.mock('react', () => {
  const actual = jest.requireActual('react');

  return {
    ...actual,
    useContext: () => mockContext,
    useState: (initial: unknown) => [
      initial === false ? true : initial,
      () => {},
    ],
    useEffect: () => {},
    useMemo: (factory: () => unknown) => factory(),
  };
});

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: {
    View: 'Animated.View',
    createAnimatedComponent: (component: unknown) => component,
  },
  useAnimatedStyle: () => ({}),
  withTiming: (value: unknown) => value,
}));
jest.mock('../helpers/external/hooks', () => ({}));
jest.mock('../helpers/internal/hooks', () => ({
  useAugmentedRef: () => ({ current: null }),
  useControllableState: () => [false, () => {}],
  useRelativePosition: () => ({}),
}));
jest.mock('../helpers/internal/components', () => ({
  ChevronRightIcon: 'ChevronRightIcon',
  ThemeBackground: 'ThemeBackground',
}));
jest.mock('../helpers/internal/contexts', () => ({
  AnimationSettingsProvider: 'AnimationSettingsProvider',
  useAnimationSettings: () => ({}),
}));
jest.mock('../components/sub-menu/sub-menu.animation', () => ({
  SubMenuAnimationProvider: 'SubMenuAnimationProvider',
  useSubMenuAnimation: () => ({}),
  useSubMenuRootAnimation: () => ({ isAllAnimationsDisabled: false }),
  useRootContentContainerAnimation: () => ({
    rOuterContainerStyle: { marginHorizontal: 0 },
    rInnerContentStyle: { paddingTop: 0 },
    backgroundExiting: undefined,
  }),
  useSubMenuTriggerIndicatorAnimation: () => ({}),
}));

type RenderFunction = {
  render: (props: Record<string, unknown>, ref: null) => ReactElement;
};

/**
 * Renders the element tree, expanding every function component (but not the
 * primitives' `forwardRef` hosts), and returns the resulting host elements.
 */
function collectHostElements(node: ReactNode): ReactElement[] {
  if (Array.isArray(node)) return node.flatMap(collectHostElements);
  if (!isValidElement(node)) return [];

  const element = node as ReactElement<{ children?: ReactNode }>;

  if (typeof element.type === 'function') {
    const Component = element.type as (props: unknown) => ReactNode;
    return collectHostElements(Component(element.props));
  }

  return [element, ...collectHostElements(element.props.children)];
}

describe('SubMenu root style', () => {
  it('applies the style prop to the rendered root container', () => {
    const style = { marginTop: 24 };

    const tree = (SubMenu as unknown as RenderFunction).render(
      { style, children: null },
      null
    );

    const rootContainer = collectHostElements(tree).find((element) =>
      String((element.props as { className?: string }).className).includes(
        'sub-menu__root'
      )
    );

    expect(rootContainer).toBeDefined();
    expect(
      StyleSheet.flatten(
        (rootContainer!.props as { style?: StyleProp<ViewStyle> }).style
      )
    ).toMatchObject(style);
  });
});
