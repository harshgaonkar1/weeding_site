import gsap from "gsap";

export { gsap };

/**
 * Animate a counter element from startValue to endValue
 * @param {HTMLElement} element - DOM element to display the number
 * @param {number} endValue - Target number
 * @param {number} duration - Duration in seconds
 */
export const animateCounter = (element, endValue, duration = 0.8) => {
  if (!element) return;
  const target = Number(endValue) || 0;
  const obj = { val: 0 };

  gsap.to(obj, {
    val: target,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      if (element) {
        element.textContent = Math.round(obj.val).toLocaleString();
      }
    },
  });
};

/**
 * Animate container children entrance with stagger
 * @param {string|HTMLElement|NodeList|Array} target - Selector or container elements
 * @param {Object} customVars - Additional GSAP vars
 */
export const animateStaggerIn = (target, customVars = {}) => {
  if (!target) return null;
  return gsap.fromTo(
    target,
    { y: 16, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: 0.35,
      stagger: 0.04,
      ease: "power2.out",
      clearProps: "all",
      ...customVars,
    }
  );
};

/**
 * Animate card spring pop
 * @param {string|HTMLElement} target
 * @param {number} delay
 */
export const animatePopIn = (target, delay = 0) => {
  if (!target) return null;
  return gsap.from(target, {
    scale: 0.92,
    y: 16,
    opacity: 0,
    duration: 0.45,
    delay,
    ease: "back.out(1.5)",
    clearProps: "transform,opacity",
  });
};

/**
 * Continuous subtle floating/breathing animation
 * @param {HTMLElement} element
 * @param {number} yDistance
 * @param {number} duration
 */
export const animateFloat = (element, yDistance = 5, duration = 2.5) => {
  if (!element) return null;
  return gsap.to(element, {
    y: `-=${yDistance}`,
    duration,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
};

/**
 * Animate modal window opening with backdrop fade and modal scale-up
 * @param {HTMLElement} backdropEl
 * @param {HTMLElement} modalEl
 * @param {Object} options
 */
export const animateModalOpen = (backdropEl, modalEl, options = {}) => {
  if (!backdropEl && !modalEl) return null;
  const tl = gsap.timeline();

  if (backdropEl) {
    tl.fromTo(
      backdropEl,
      { opacity: 0 },
      { opacity: 1, duration: 0.25, ease: "power2.out" }
    );
  }

  if (modalEl) {
    tl.fromTo(
      modalEl,
      { opacity: 0, scale: 0.88, y: 30 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.4,
        ease: "back.out(1.4)",
        clearProps: "transform,opacity",
        ...options,
      },
      backdropEl ? "-=0.15" : 0
    );
  }

  return tl;
};

/**
 * Animate modal window closing gracefully before unmounting
 * @param {HTMLElement} backdropEl
 * @param {HTMLElement} modalEl
 * @param {Function} onComplete
 */
export const animateModalClose = (backdropEl, modalEl, onComplete) => {
  const tl = gsap.timeline({
    onComplete: () => {
      if (typeof onComplete === "function") onComplete();
    },
  });

  if (modalEl) {
    tl.to(modalEl, {
      opacity: 0,
      scale: 0.92,
      y: 20,
      duration: 0.22,
      ease: "power2.in",
    });
  }

  if (backdropEl) {
    tl.to(
      backdropEl,
      { opacity: 0, duration: 0.16, ease: "power1.out" },
      "-=0.1"
    );
  }

  return tl;
};

/**
 * Animate newly added chat message bubble
 * @param {HTMLElement} bubbleEl
 */
export const animateNewMessage = (bubbleEl) => {
  if (!bubbleEl) return null;
  return gsap.fromTo(
    bubbleEl,
    { opacity: 0, y: 16, scale: 0.95 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.35,
      ease: "back.out(1.3)",
      clearProps: "transform,opacity",
    }
  );
};

/**
 * Animate badge bounce / notification pop
 * @param {HTMLElement} badgeEl
 */
export const animateNotificationBadge = (badgeEl) => {
  if (!badgeEl) return null;
  return gsap.fromTo(
    badgeEl,
    { scale: 0, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration: 0.5,
      ease: "elastic.out(1.2, 0.4)",
      clearProps: "transform,opacity",
    }
  );
};

/**
 * Animate widget bounce / punch when a new event or message happens
 * @param {HTMLElement} widgetEl
 */
export const animateWidgetBounce = (widgetEl) => {
  if (!widgetEl) return null;
  return gsap
    .timeline()
    .to(widgetEl, { scale: 1.18, rotation: -6, duration: 0.12, ease: "power2.out" })
    .to(widgetEl, { scale: 1.12, rotation: 6, duration: 0.12, ease: "power2.out" })
    .to(widgetEl, { scale: 1, rotation: 0, duration: 0.4, ease: "elastic.out(1.2, 0.4)" });
};

/**
 * Animate toast notification entrance
 * @param {HTMLElement} toastEl
 */
export const animateToastIn = (toastEl) => {
  if (!toastEl) return null;
  return gsap.fromTo(
    toastEl,
    { x: 50, opacity: 0, scale: 0.9 },
    {
      x: 0,
      opacity: 1,
      scale: 1,
      duration: 0.4,
      ease: "back.out(1.5)",
      clearProps: "transform,opacity",
    }
  );
};

/**
 * Animate toast notification exit
 * @param {HTMLElement} toastEl
 * @param {Function} onComplete
 */
export const animateToastOut = (toastEl, onComplete) => {
  if (!toastEl) {
    if (onComplete) onComplete();
    return null;
  }
  return gsap.to(toastEl, {
    x: 40,
    opacity: 0,
    scale: 0.95,
    duration: 0.25,
    ease: "power2.in",
    onComplete,
  });
};

export default {
  gsap,
  animateCounter,
  animateStaggerIn,
  animatePopIn,
  animateFloat,
  animateModalOpen,
  animateModalClose,
  animateNewMessage,
  animateNotificationBadge,
  animateWidgetBounce,
  animateToastIn,
  animateToastOut,
};
