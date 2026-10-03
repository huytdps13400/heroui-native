import type { ReactElement } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Trigger } from '../primitives/select/select';

/**
 * The Select primitive Trigger only reads its Root through context and
 * registers effects, so its `forwardRef` render function can be invoked
 * directly once those hooks are stubbed: `useContext` returns the Root context
 * under test, `useState` returns its initial value and effects are skipped.
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

const TRIGGER_MEASUREMENT = [0, 0, 120, 40, 16, 200] as const;

jest.mock('../helpers/internal/hooks', () => ({
  useAugmentedRef: () => ({
    current: {
      measure: (callback: (...values: number[]) => void) =>
        callback(...TRIGGER_MEASUREMENT),
    },
  }),
  useControllableState: jest.fn(),
  useRelativePosition: jest.fn(),
}));

type TriggerRenderFunction = {
  render: (props: Record<string, unknown>, ref: null) => ReactElement;
};

function renderTrigger(rootContext: Record<string, unknown>) {
  const context = {
    isOpen: false,
    onOpenChange: jest.fn(),
    setTriggerPosition: jest.fn(),
    setContentLayout: jest.fn(),
    triggerPosition: null,
    presentation: 'popover',
    ...rootContext,
  };
  mockRootContext.current = context;

  const props = (Trigger as unknown as TriggerRenderFunction).render({}, null)
    .props as { onLayout: (event: LayoutChangeEvent) => void };

  return { context, props };
}

const layoutEvent = {
  nativeEvent: { layout: { x: 0, y: 0, width: 120, height: 40 } },
} as LayoutChangeEvent;

describe('Select.Trigger with isDefaultOpen', () => {
  it('does not reopen the select when the trigger lays out again after it was closed', () => {
    const { context, props } = renderTrigger({
      isDefaultOpen: true,
      isOpen: false,
    });

    props.onLayout(layoutEvent);

    expect(context.onOpenChange).not.toHaveBeenCalled();
  });

  it('still updates the trigger position on layout', () => {
    const { context, props } = renderTrigger({
      isDefaultOpen: true,
      isOpen: false,
    });

    props.onLayout(layoutEvent);

    expect(context.setTriggerPosition).toHaveBeenCalledWith({
      width: 120,
      height: 40,
      pageX: 16,
      pageY: 200,
    });
  });
});
