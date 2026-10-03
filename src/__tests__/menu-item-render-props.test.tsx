import { isValidElement, type ReactElement, type ReactNode } from 'react';
import Menu from '../components/menu/menu';
import type { MenuItemRenderProps } from '../components/menu/menu.types';

/**
 * Menu.Item and the primitive Menu.Item only read their state through context
 * and memoization hooks, so the element tree can be rendered by invoking the
 * render functions directly. `useContext` returns whatever context value is
 * currently in scope: the test starts with the Menu root and Menu.Group values
 * and every context provider met while walking the tree replaces it for its
 * subtree, so the primitive item resolves its state exactly as it does inside
 * a real Menu.Group.
 */
const mockContext: { current: Record<string, unknown> } = { current: {} };

jest.mock('react', () => {
  const actual = jest.requireActual('react');

  return {
    ...actual,
    useContext: () => mockContext.current,
    useCallback: (callback: unknown) => callback,
    useMemo: (factory: () => unknown) => factory(),
  };
});

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: {
    View: 'Animated.View',
    createAnimatedComponent: (component: unknown) => component,
  },
  FadeOut: { duration: () => undefined },
}));
jest.mock('react-native-safe-area-context', () => ({}));
jest.mock('../helpers/external/hooks', () => ({}));
jest.mock('../helpers/internal/components', () => ({}));
jest.mock('../helpers/internal/contexts', () => ({}));
jest.mock('../helpers/internal/hooks', () => ({}));
jest.mock('../components/close-button', () => ({}));
jest.mock('../components/sub-menu', () => ({ useSubMenu: () => undefined }));

const mockIsPressed = { value: false };

jest.mock('../components/menu/menu.animation', () => ({
  useMenuItemAnimation: () => ({
    rItemStyle: {},
    isPressed: mockIsPressed,
    animationOnPressIn: () => {},
    animationOnPressOut: () => {},
  }),
}));

type ElementType = {
  $$typeof?: symbol;
  displayName?: string;
  render?: (props: unknown, ref: null) => ReactNode;
};

/**
 * Renders the element tree, expanding plain function components and the
 * library's own `forwardRef` components; React Native components are left as
 * hosts and only their children are walked.
 */
function renderTree(node: ReactNode): void {
  if (Array.isArray(node)) {
    node.forEach(renderTree);
    return;
  }
  if (!isValidElement(node)) return;

  const element = node as ReactElement<{
    children?: ReactNode;
    value?: Record<string, unknown>;
  }>;
  const type = element.type as unknown as ElementType;

  if (typeof element.type === 'function') {
    const Component = element.type as (props: unknown) => ReactNode;
    renderTree(Component(element.props));
    return;
  }

  if (type.render && type.displayName?.startsWith('HeroUINative.')) {
    renderTree(type.render(element.props, null));
    return;
  }

  if (type.$$typeof === Symbol.for('react.context')) {
    const parentContext = mockContext.current;
    mockContext.current = element.props.value ?? {};
    renderTree(element.props.children);
    mockContext.current = parentContext;
    return;
  }

  renderTree(element.props.children);
}

/** Menu root + Menu.Group context values seen by an item inside a group. */
function groupContext(group: Record<string, unknown>) {
  return {
    isSubMenuOpen: false,
    onOpenChange: () => {},
    setTriggerPosition: () => {},
    setContentLayout: () => {},
    selectionMode: 'single',
    selectedKeys: new Set(),
    disabledKeys: new Set(),
    isDisabled: false,
    onSelectionChange: () => {},
    disallowEmptySelection: false,
    ...group,
  };
}

function renderItemChildren(context: Record<string, unknown>) {
  const children = jest.fn((_props: MenuItemRenderProps) => null);
  mockContext.current = context;

  const { render } = Menu.Item as unknown as Required<ElementType>;
  renderTree(render({ id: 'bold', children }, null));

  return children;
}

describe('Menu.Item render function', () => {
  it('receives isSelected from the Menu.Group selected keys', () => {
    const children = renderItemChildren(
      groupContext({ selectedKeys: new Set(['bold']) })
    );

    expect(children).toHaveBeenCalledWith(
      expect.objectContaining({ isSelected: true, isDisabled: false })
    );
  });

  it('receives isDisabled when the Menu.Group is disabled', () => {
    const children = renderItemChildren(groupContext({ isDisabled: true }));

    expect(children).toHaveBeenCalledWith(
      expect.objectContaining({ isSelected: false, isDisabled: true })
    );
  });

  it('receives isDisabled when its id is in the Menu.Group disabled keys', () => {
    const children = renderItemChildren(
      groupContext({ disabledKeys: new Set(['bold']) })
    );

    expect(children).toHaveBeenCalledWith(
      expect.objectContaining({ isDisabled: true })
    );
  });
});
