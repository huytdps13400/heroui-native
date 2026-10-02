import { createRef, type ReactElement, type Ref } from 'react';
import {
  Image as RNImage,
  Pressable as RNPressable,
  Text as RNText,
  View as RNView,
} from 'react-native';
import * as Slot from '../primitives/slot';

type SlotRender = (
  props: { children: ReactElement },
  ref: Ref<unknown> | null
) => ReactElement<{ ref?: Ref<unknown> }>;

/**
 * The Slot primitives call no hooks, so their `forwardRef` render functions
 * can be invoked directly to inspect the cloned child element.
 */
function renderSlot(
  component: unknown,
  children: ReactElement,
  forwardedRef: Ref<unknown> | null = null
) {
  const { render } = component as { render: SlotRender };
  return render({ children }, forwardedRef);
}

const cases: [string, unknown, (ref: Ref<any>) => ReactElement][] = [
  ['Pressable', Slot.Pressable, (ref) => <RNPressable ref={ref} />],
  ['View', Slot.View, (ref) => <RNView ref={ref} />],
  ['Text', Slot.Text, (ref) => <RNText ref={ref} />],
  ['Image', Slot.Image, (ref) => <RNImage ref={ref} />],
];

describe.each(cases)(
  'Slot.%s child ref',
  (_name, SlotComponent, renderChild) => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('reads the child ref without the React 19 element.ref warning', () => {
      const childRef = createRef<unknown>();
      const forwardedRef = createRef<unknown>();

      renderSlot(SlotComponent, renderChild(childRef), forwardedRef);
      renderSlot(SlotComponent, renderChild(childRef));

      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Accessing element.ref was removed in React 19')
      );
    });

    it('keeps the child ref when no ref is forwarded', () => {
      const childRef = createRef<unknown>();

      const element = renderSlot(SlotComponent, renderChild(childRef));

      expect(element.props.ref).toBe(childRef);
    });

    it('composes the forwarded ref with the child ref', () => {
      const childRef = createRef<unknown>();
      const forwardedRef = createRef<unknown>();
      const node = {};

      const element = renderSlot(
        SlotComponent,
        renderChild(childRef),
        forwardedRef
      );

      expect(typeof element.props.ref).toBe('function');
      (element.props.ref as (instance: unknown) => void)(node);

      expect(childRef.current).toBe(node);
      expect(forwardedRef.current).toBe(node);
    });
  }
);
