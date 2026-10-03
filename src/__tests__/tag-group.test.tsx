import type { ReactElement } from 'react';
import TagGroup from '../components/tag-group/tag-group';
import type { TagGroupProps } from '../components/tag-group/tag-group.types';
import * as TagGroupPrimitives from '../primitives/tag-group';
import type { RootContextValue } from '../primitives/tag-group/tag-group.types';

/**
 * TagGroup and its primitive Root only memoize values and hold the
 * uncontrolled selection in state, so those hooks are stubbed to run inline
 * and the `forwardRef` render functions can be invoked directly.
 */
jest.mock('react', () => {
  const actual = jest.requireActual('react');

  return {
    ...actual,
    useMemo: (factory: () => unknown) => factory(),
    useCallback: (callback: unknown) => callback,
    useState: (initial: unknown) => [
      typeof initial === 'function' ? (initial as () => unknown)() : initial,
      () => {},
    ],
  };
});
jest.mock('react-native-reanimated', () => ({}));
jest.mock('../helpers/external/hooks', () => ({}));
jest.mock('../helpers/internal/components', () => ({}));
jest.mock('../helpers/internal/components/close-icon', () => ({}));
jest.mock('../components/tag-group/tag-group.animation', () => ({
  useTagGroupRootAnimation: () => ({ isAllAnimationsDisabled: false }),
}));

type RenderFn<P> = { render: (props: P, ref: null) => ReactElement };

function findElement(
  element: ReactElement,
  type: unknown
): ReactElement<Record<string, any>> {
  let current: ReactElement = element;

  while (current.type !== type) {
    current = (current.props as { children: ReactElement }).children;
  }

  return current as ReactElement<Record<string, any>>;
}

/**
 * Renders TagGroup down to the primitive Root and returns the value the
 * primitive provides to `useTagGroup()` consumers.
 */
function getTagGroupContext(props: TagGroupProps): RootContextValue {
  const tagGroup = (TagGroup as unknown as RenderFn<TagGroupProps>).render(
    props,
    null
  );
  const primitiveRoot = findElement(tagGroup, TagGroupPrimitives.Root);

  const provider = (
    TagGroupPrimitives.Root as unknown as RenderFn<Record<string, any>>
  ).render(primitiveRoot.props, null);

  return (provider.props as { value: RootContextValue }).value;
}

describe('TagGroup root state', () => {
  it('exposes isInvalid and isRequired through useTagGroup', () => {
    const context = getTagGroupContext({
      children: null,
      isInvalid: true,
      isRequired: true,
    });

    expect(context.isInvalid).toBe(true);
    expect(context.isRequired).toBe(true);
  });

  it('defaults isInvalid, isRequired and isDisabled to false', () => {
    const context = getTagGroupContext({ children: null });

    expect(context.isInvalid).toBe(false);
    expect(context.isRequired).toBe(false);
    expect(context.isDisabled).toBe(false);
  });

  it('exposes isDisabled through useTagGroup', () => {
    const context = getTagGroupContext({ children: null, isDisabled: true });

    expect(context.isDisabled).toBe(true);
  });
});
