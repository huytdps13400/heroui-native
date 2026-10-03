import type { ReactElement } from 'react';
import Select from '../components/select/select';
import { Trigger as MenuTrigger } from '../primitives/menu/menu';
import { Trigger as PopoverTrigger } from '../primitives/popover/popover';

/**
 * The triggers only read their Root through context and register effects, so
 * their `forwardRef` render functions can be invoked directly once those hooks
 * are stubbed: `useContext` returns the Root context under test, `useState`
 * returns its initial value and effects are skipped.
 */
const mockRootContext: { current: Record<string, unknown> } = { current: {} };

jest.mock('react', () => {
  const actual = jest.requireActual('react');

  return {
    ...actual,
    useContext: () => mockRootContext.current,
    useState: (initial: unknown) => [
      typeof initial === 'function' ? initial() : initial,
      () => {},
    ],
    useEffect: () => {},
    useLayoutEffect: () => {},
  };
});

/**
 * The shared hooks barrel pulls in the animation runtime, so it is replaced
 * with the hooks the primitives call.
 */
jest.mock('../helpers/internal/hooks', () => ({
  useAugmentedRef: () => ({ current: null }),
  useControllableState: jest.fn(),
  useRelativePosition: jest.fn(),
}));

/**
 * `Select` itself is only rendered down to its primitive trigger, so its
 * animation and overlay dependencies are stubbed.
 */
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { createAnimatedComponent: (component: unknown) => component },
}));
jest.mock('react-native-gesture-handler', () => ({}));
jest.mock('../helpers/external/hooks', () => ({}));
jest.mock('../helpers/internal/components', () => ({
  useHasDefaultThemeBackground: () => false,
}));
jest.mock('../components/close-button', () => ({}));
jest.mock('../components/select/select.animation', () => ({}));

type TriggerRenderFunction = {
  render: (props: Record<string, unknown>, ref: null) => ReactElement;
};

function getTriggerProps(
  Trigger: unknown,
  rootContext: Record<string, unknown>,
  props: Record<string, unknown> = {}
): Record<string, unknown> {
  mockRootContext.current = {
    isOpen: false,
    onOpenChange: jest.fn(),
    setTriggerPosition: jest.fn(),
    setContentLayout: jest.fn(),
    triggerPosition: null,
    presentation: 'popover',
    ...rootContext,
  };

  return (Trigger as TriggerRenderFunction).render(props, null).props as Record<
    string,
    unknown
  >;
}

describe('Select.Trigger', () => {
  it('forwards its own isDisabled prop to the primitive trigger', () => {
    const props = getTriggerProps(
      Select.Trigger,
      { isDisabled: false },
      { isDisabled: true }
    );

    expect(props.isDisabled).toBe(true);
  });
});

describe.each([
  ['Menu', MenuTrigger],
  ['Popover', PopoverTrigger],
])('%s.Trigger', (_name, Trigger) => {
  it('is disabled when the Root is disabled', () => {
    const props = getTriggerProps(Trigger, { isDisabled: true });

    expect(props.disabled).toBe(true);
    expect(props['aria-disabled']).toBe(true);
  });

  it('is disabled by its own isDisabled prop', () => {
    const props = getTriggerProps(
      Trigger,
      { isDisabled: false },
      { isDisabled: true }
    );

    expect(props.disabled).toBe(true);
    expect(props['aria-disabled']).toBe(true);
  });

  it('is enabled when neither the Root nor the Trigger is disabled', () => {
    const props = getTriggerProps(Trigger, {});

    expect(props.disabled).toBeFalsy();
    expect(props['aria-disabled']).toBeFalsy();
  });
});
