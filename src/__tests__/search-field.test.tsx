import type { ReactElement } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Button } from '../components/button';
import SearchField from '../components/search-field/search-field';
import type {
  SearchFieldClearButtonProps,
  SearchFieldContextType,
  SearchFieldProps,
} from '../components/search-field/search-field.types';

/**
 * SearchField's hooks only memoize values, read context, and register the
 * clear button slot, so they are stubbed and the `forwardRef` render
 * functions can be invoked directly. Context reads resolve by context name
 * from `mockContextValues`. Button is only checked for the props it receives.
 */
const mockContextValues: Record<string, unknown> = {};

jest.mock('react', () => {
  const actual = jest.requireActual('react');

  return {
    ...actual,
    useMemo: (factory: () => unknown) => factory(),
    useState: (initial: unknown) => [initial, () => {}],
    useLayoutEffect: () => {},
    useContext: (context: { displayName?: string }) =>
      mockContextValues[context.displayName ?? ''],
  };
});
jest.mock('react-native-reanimated', () => ({}));
jest.mock('../helpers/external/hooks', () => ({
  useThemeColor: () => '#000',
}));
jest.mock('../helpers/internal/components', () => ({
  CloseIcon: () => null,
}));
jest.mock('../helpers/internal/contexts', () => ({
  AnimationSettingsProvider: 'AnimationSettingsProvider',
  FormFieldProvider: 'FormFieldProvider',
}));
jest.mock('../components/button', () => ({ Button: () => null }));
jest.mock('../components/input', () => ({ Input: () => null }));
jest.mock('../components/search-field/search-icon', () => ({
  SearchIcon: () => null,
}));
jest.mock('../components/search-field/search-field.animation', () => ({
  useSearchFieldRootAnimation: () => ({ isAllAnimationsDisabled: false }),
}));

type RenderFn<P> = { render: (props: P, ref: null) => ReactElement | null };

/** Returns the SearchFieldContext value the root provides to its parts. */
function getSearchFieldContext(
  props: SearchFieldProps
): SearchFieldContextType {
  const root = (SearchField as unknown as RenderFn<SearchFieldProps>).render(
    props,
    null
  ) as ReactElement<{ value: SearchFieldContextType }>;

  return root.props.value;
}

/** Renders ClearButton inside the given SearchField and returns its Button. */
function renderClearButton(
  rootProps: SearchFieldProps,
  props: SearchFieldClearButtonProps = {}
): ReactElement<Record<string, any>> {
  mockContextValues.SearchFieldContext = getSearchFieldContext(rootProps);
  mockContextValues.SearchFieldSlotsContext = undefined;

  const element = (
    SearchField.ClearButton as unknown as RenderFn<SearchFieldClearButtonProps>
  ).render(props, null) as ReactElement<Record<string, any>>;

  expect(element.type).toBe(Button);

  return element;
}

describe('SearchField.ClearButton disabled state', () => {
  it('is disabled when the SearchField is disabled', () => {
    const button = renderClearButton({
      value: 'query',
      onChange: () => {},
      isDisabled: true,
    });

    expect(button.props.isDisabled).toBe(true);
  });

  it('is enabled when the SearchField is enabled', () => {
    const button = renderClearButton({ value: 'query', onChange: () => {} });

    expect(button.props.isDisabled).toBeFalsy();
  });

  it('lets an explicit isDisabled on the ClearButton win', () => {
    const button = renderClearButton(
      { value: 'query', onChange: () => {}, isDisabled: true },
      { isDisabled: false }
    );

    expect(button.props.isDisabled).toBe(false);
  });

  it('clears the value and calls onPress when pressed', () => {
    const onChange = jest.fn();
    const onPress = jest.fn();
    const event = {} as GestureResponderEvent;
    const button = renderClearButton({ value: 'query', onChange }, { onPress });

    button.props.onPress(event);

    expect(onChange).toHaveBeenCalledWith('');
    expect(onPress).toHaveBeenCalledWith(event);
  });
});
