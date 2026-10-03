import type { ReactElement } from 'react';
import { Pressable, type GestureResponderEvent } from 'react-native';
import ControlField from '../components/control-field/control-field';
import type { ControlFieldProps } from '../components/control-field/control-field.types';

/**
 * ControlField's hooks only memoize values, so they are stubbed to run their
 * factories inline and the `forwardRef` render function can be invoked
 * directly. The indicator components (and the animation runtime they pull
 * in) are not exercised here.
 */
jest.mock('react', () => {
  const actual = jest.requireActual('react');

  return {
    ...actual,
    useMemo: (factory: () => unknown) => factory(),
    useCallback: (callback: unknown) => callback,
  };
});
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (value: unknown) => ({ value, set: () => {} }),
}));
jest.mock('../components/checkbox', () => ({}));
jest.mock('../components/radio', () => ({}));
jest.mock('../components/switch', () => ({}));
jest.mock('../components/control-field/control-field.animation', () => ({
  useControlFieldRootAnimation: () => ({ isAllAnimationsDisabled: false }),
}));

function findPressableProps(element: ReactElement): Record<string, any> {
  let current: ReactElement = element;

  while (current.type !== Pressable) {
    current = (current.props as { children: ReactElement }).children;
  }

  return current.props as Record<string, any>;
}

function renderControlField(props: ControlFieldProps) {
  const { render } = ControlField as unknown as {
    render: (props: ControlFieldProps, ref: null) => ReactElement;
  };

  return findPressableProps(render(props, null));
}

const pressEvent = {} as GestureResponderEvent;

describe('ControlField onPress', () => {
  it('toggles the selection when pressed', () => {
    const onSelectedChange = jest.fn();
    const pressable = renderControlField({
      isSelected: false,
      onSelectedChange,
    });

    pressable.onPress(pressEvent);

    expect(onSelectedChange).toHaveBeenCalledWith(true);
  });

  it('still toggles the selection when a consumer onPress is passed', () => {
    const onSelectedChange = jest.fn();
    const onPress = jest.fn();
    const pressable = renderControlField({
      isSelected: false,
      onSelectedChange,
      onPress,
    });

    pressable.onPress(pressEvent);

    expect(onSelectedChange).toHaveBeenCalledWith(true);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(pressEvent);
  });

  it('calls a consumer onPress without selection props', () => {
    const onPress = jest.fn();
    const pressable = renderControlField({ onPress });

    pressable.onPress(pressEvent);

    expect(onPress).toHaveBeenCalledWith(pressEvent);
  });

  it('does not toggle when disabled', () => {
    const onSelectedChange = jest.fn();
    const pressable = renderControlField({
      isSelected: false,
      isDisabled: true,
      onSelectedChange,
      onPress: jest.fn(),
    });

    pressable.onPress(pressEvent);

    expect(onSelectedChange).not.toHaveBeenCalled();
  });
});
