import type { ReactElement } from 'react';
import {
  createConfigToastComponent,
  createStringToastComponent,
} from '../providers/toast/provider';
import type {
  ToastComponentProps,
  ToastGlobalConfig,
} from '../providers/toast/types';

/**
 * Only the toast component factories are exercised here, so the provider's
 * rendering dependencies are stubbed out.
 */
jest.mock('react-native-reanimated', () => ({ useSharedValue: jest.fn() }));
jest.mock('../components/toast/toast', () => ({ DefaultToast: () => null }));
jest.mock('../providers/toast/insets-container', () => ({
  InsetsContainer: () => null,
}));
jest.mock('../providers/toast/toast-item-renderer', () => ({
  ToastItemRenderer: () => null,
}));

/**
 * The toast component factories return plain render functions that call no
 * hooks, so they can be invoked directly to read the props handed to the
 * underlying `DefaultToast`.
 */
function getToastProps(
  component: (props: ToastComponentProps) => ReactElement
): Record<string, unknown> {
  return component({} as ToastComponentProps).props as Record<string, unknown>;
}

const globalConfig: ToastGlobalConfig = {
  variant: 'accent',
  placement: 'bottom',
  isSwipeable: false,
};

describe('ToastProvider defaultProps', () => {
  it('applies the global variant to string toasts', () => {
    const props = getToastProps(
      createStringToastComponent('Saved', globalConfig)
    );

    expect(props.label).toBe('Saved');
    expect(props.variant).toBe('accent');
    expect(props.placement).toBe('bottom');
    expect(props.isSwipeable).toBe(false);
  });

  it('applies the global variant to config toasts without a variant', () => {
    const props = getToastProps(
      createConfigToastComponent({ label: 'Saved' }, globalConfig)
    );

    expect(props.variant).toBe('accent');
  });

  it('lets a config toast variant override the global variant', () => {
    const props = getToastProps(
      createConfigToastComponent(
        { label: 'Failed', variant: 'danger' },
        globalConfig
      )
    );

    expect(props.variant).toBe('danger');
  });
});
