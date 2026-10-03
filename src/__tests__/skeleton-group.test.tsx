import type { ReactElement } from 'react';
import SkeletonGroup from '../components/skeleton-group/skeleton-group';
import type { SkeletonGroupRootProps } from '../components/skeleton-group/skeleton-group.types';

/**
 * The SkeletonGroup root only calls `useMemo`, so it is stubbed to run the
 * factory inline and the render function can be invoked directly.
 */
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useMemo: (factory: () => unknown) => factory(),
}));

jest.mock('../components/skeleton/skeleton', () => ({
  __esModule: true,
  default: () => null,
}));

function renderRoot(props: SkeletonGroupRootProps): ReactElement | null {
  return (
    SkeletonGroup as unknown as (
      props: SkeletonGroupRootProps
    ) => ReactElement | null
  )(props);
}

describe('SkeletonGroup isSkeletonOnly', () => {
  it('renders the group when isLoading is omitted (defaults to true)', () => {
    expect(renderRoot({ isSkeletonOnly: true })).not.toBeNull();
  });

  it('renders the group when isLoading is true', () => {
    expect(
      renderRoot({ isSkeletonOnly: true, isLoading: true })
    ).not.toBeNull();
  });

  it('hides the group when isLoading is false', () => {
    expect(renderRoot({ isSkeletonOnly: true, isLoading: false })).toBeNull();
  });
});
