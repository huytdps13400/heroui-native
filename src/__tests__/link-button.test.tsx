import type { ReactElement } from 'react';
import LinkButton from '../components/link-button/link-button';
import type { LinkButtonProps } from '../components/link-button/link-button.types';

/**
 * LinkButton is only rendered down to the underlying Button element, so the
 * Button module (and the animation runtime it pulls in) is stubbed.
 */
jest.mock('../components/button', () => ({ Button: () => null }));

/**
 * The LinkButton root calls no hooks, so its `forwardRef` render function can
 * be invoked directly to read the `animation` handed to Button.
 */
function getButtonAnimation(props: LinkButtonProps): unknown {
  const { render } = LinkButton as unknown as {
    render: (props: LinkButtonProps, ref: null) => ReactElement;
  };

  return (render(props, null).props as { animation: unknown }).animation;
}

describe('LinkButton animation', () => {
  it('turns off the highlight while keeping the default feedback', () => {
    expect(getButtonAnimation({})).toEqual({ highlight: false });
    expect(getButtonAnimation({ animation: true })).toEqual({
      highlight: false,
    });
  });

  it('keeps custom sub-animation config', () => {
    expect(
      getButtonAnimation({ animation: { scale: { value: 0.9 } } })
    ).toEqual({ scale: { value: 0.9 }, highlight: false });
  });

  it.each([false, 'disabled', 'disable-all'] as const)(
    'forwards animation={%p} so Button disables its feedback',
    (animation) => {
      expect(getButtonAnimation({ animation })).toBe(animation);
    }
  );
});
