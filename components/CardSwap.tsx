import React, {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  ReactElement,
  ReactNode,
  RefObject,
  useEffect,
  useMemo,
  useRef
} from 'react';
import gsap from 'gsap';

export interface CardSwapProps {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  onCardClick?: (idx: number) => void;
  skewAmount?: number;
  easing?: 'linear' | 'elastic';
  activeIndex?: number;
  onActiveIndexChange?: (idx: number) => void;
  className?: string;
  invertStacking?: boolean;
  children: ReactNode;
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  customClass?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ customClass, ...rest }, ref) => (
  <div
    ref={ref}
    {...rest}
    className={`absolute top-1/2 left-1/2 rounded-2xl border border-white/10 bg-[#111014]/95 shadow-[0_20px_50px_rgba(0,0,0,0.5)] [transform-style:preserve-3d] [will-change:transform] [backface-visibility:hidden] p-6 text-white flex flex-col justify-between ${customClass ?? ''} ${rest.className ?? ''}`.trim()}
  />
));
Card.displayName = 'Card';

type CardRef = RefObject<HTMLDivElement | null>;
interface Slot {
  x: number;
  y: number;
  z: number;
  zIndex: number;
}

const makeSlot = (i: number, distX: number, distY: number, total: number, invert: boolean = false): Slot => ({
  x: (invert ? -1 : 1) * i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i
});

const placeNow = (el: HTMLElement, slot: Slot, skew: number) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true
  });

const CardSwap: React.FC<CardSwapProps> = ({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
  onCardClick,
  skewAmount = 6,
  easing = 'elastic',
  activeIndex,
  onActiveIndexChange,
  invertStacking = false,
  className = "right-0 md:right-20 transform translate-x-[-10%] md:translate-x-[-15%] translate-y-[0%] origin-bottom-right max-[768px]:translate-x-[-5%] max-[768px]:translate-y-[5%] max-[768px]:scale-[0.75] max-[480px]:translate-x-[-2%] max-[480px]:translate-y-[5%] max-[480px]:scale-[0.6]",
  children
}) => {
  const config =
    easing === 'elastic'
      ? {
          ease: 'elastic.out(0.6,0.9)',
          durDrop: 2,
          durMove: 2,
          durReturn: 2,
          promoteOverlap: 0.9,
          returnDelay: 0.05
        }
      : {
          ease: 'power1.inOut',
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.45,
          returnDelay: 0.2
        };

  const childArr = useMemo(() => Children.toArray(children) as ReactElement<CardProps>[], [children]);
  const refs = useMemo<CardRef[]>(() => childArr.map(() => React.createRef<HTMLDivElement>()), [childArr.length]);

  const order = useRef<number[]>(Array.from({ length: childArr.length }, (_, i) => i));

  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const intervalRef = useRef<number>(0);
  const container = useRef<HTMLDivElement>(null);

  // Define the normal auto swap function
  const swap = () => {
    if (order.current.length < 2) return;

    const [front, ...rest] = order.current;
    const elFront = refs[front].current!;
    const tl = gsap.timeline();
    tlRef.current = tl;

    tl.to(elFront, {
      y: '+=500',
      duration: config.durDrop,
      ease: config.ease
    });

    tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
    rest.forEach((idx, i) => {
      const el = refs[idx].current!;
      const slot = makeSlot(i, cardDistance, verticalDistance, refs.length, invertStacking);
      tl.set(el, { zIndex: slot.zIndex }, 'promote');
      tl.to(
        el,
        {
          x: slot.x,
          y: slot.y,
          z: slot.z,
          duration: config.durMove,
          ease: config.ease
        },
        `promote+=${i * 0.15}`
      );
    });

    const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length, invertStacking);
    tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
    tl.call(
      () => {
        gsap.set(elFront, { zIndex: backSlot.zIndex });
      },
      undefined,
      'return'
    );
    tl.to(
      elFront,
      {
        x: backSlot.x,
        y: backSlot.y,
        z: backSlot.z,
        duration: config.durReturn,
        ease: config.ease
      },
      'return'
    );

    tl.call(() => {
      order.current = [...rest, front];
      if (onActiveIndexChange) {
        onActiveIndexChange(rest[0]);
      }
    });
  };

  // Define swapTo function for programmatic swap
  const swapTo = (targetIdx: number) => {
    if (order.current.length < 2) return;
    const orderIndex = order.current.indexOf(targetIdx);
    if (orderIndex === 0) return; // Already at the front!

    // Temporarily pause timeline
    if (tlRef.current) {
      tlRef.current.kill();
    }

    const front = order.current[0];
    const elFront = refs[front].current!;
    const tl = gsap.timeline();
    tlRef.current = tl;

    tl.to(elFront, {
      y: '+=500',
      duration: config.durDrop * 0.5,
      ease: config.ease
    });

    const newOrder = [...order.current.slice(orderIndex), ...order.current.slice(0, orderIndex)];

    tl.addLabel('promote', `-=${config.durDrop * 0.5 * config.promoteOverlap}`);
    newOrder.forEach((idx, i) => {
      if (idx === front) return;
      const el = refs[idx].current!;
      const slot = makeSlot(i, cardDistance, verticalDistance, refs.length, invertStacking);
      tl.set(el, { zIndex: slot.zIndex }, 'promote');
      tl.to(
        el,
        {
          x: slot.x,
          y: slot.y,
          z: slot.z,
          duration: config.durMove * 0.5,
          ease: config.ease
        },
        `promote+=${i * 0.1}`
      );
    });

    const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length, invertStacking);
    tl.addLabel('return', `promote+=${config.durMove * 0.5 * config.returnDelay}`);
    tl.call(
      () => {
        gsap.set(elFront, { zIndex: backSlot.zIndex });
      },
      undefined,
      'return'
    );
    tl.to(
      elFront,
      {
        x: backSlot.x,
        y: backSlot.y,
        z: backSlot.z,
        duration: config.durReturn * 0.5,
        ease: config.ease
      },
      'return'
    );

    tl.call(() => {
      order.current = newOrder;
      if (onActiveIndexChange) {
        onActiveIndexChange(targetIdx);
      }
    });
  };

  // Setup interval and placement
  useEffect(() => {
    const total = refs.length;
    const skew = invertStacking ? -skewAmount : skewAmount;
    refs.forEach((r, i) => placeNow(r.current!, makeSlot(i, cardDistance, verticalDistance, total, invertStacking), skew));

    intervalRef.current = window.setInterval(swap, delay);

    if (pauseOnHover) {
      const node = container.current!;
      const pause = () => {
        tlRef.current?.pause();
        clearInterval(intervalRef.current);
      };
      const resume = () => {
        tlRef.current?.play();
        intervalRef.current = window.setInterval(swap, delay);
      };
      node.addEventListener('mouseenter', pause);
      node.addEventListener('mouseleave', resume);
      return () => {
        node.removeEventListener('mouseenter', pause);
        node.removeEventListener('mouseleave', resume);
        clearInterval(intervalRef.current);
      };
    }
    return () => clearInterval(intervalRef.current);
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing]);

  // Hook to watch activeIndex changes
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (activeIndex !== undefined && activeIndex >= 0 && activeIndex < refs.length) {
      // Clear auto-interval and swap immediately
      clearInterval(intervalRef.current);
      swapTo(activeIndex);
      // Restart interval
      intervalRef.current = window.setInterval(swap, delay);
    }
  }, [activeIndex]);

  const rendered = childArr.map((child, i) =>
    isValidElement<CardProps>(child)
      ? cloneElement(child, {
          key: i,
          ref: refs[i],
          style: { width, height, ...(child.props.style ?? {}) },
          onClick: e => {
            child.props.onClick?.(e as React.MouseEvent<HTMLDivElement>);
            onCardClick?.(i);
          }
        } as CardProps & React.RefAttributes<HTMLDivElement>)
      : child
  );

  return (
    <div
      ref={container}
      className={`absolute bottom-0 perspective-[900px] overflow-visible ${className}`}
      style={{ width, height }}
    >
      {rendered}
    </div>
  );
};

export default CardSwap;
