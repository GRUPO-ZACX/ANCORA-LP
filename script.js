document.documentElement.classList.add("js");

const LINYT_CAPTURE_URL = "https://app.linyt.com.br/api/capture/995c68f3-dd40-42db-bce0-6debf22b1d3b";

document.querySelectorAll(".lead-form").forEach((form) => {
  const submitButton = form.querySelector('button[type="submit"]');
  const status = document.createElement("p");
  status.className = "lead-form__status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  form.append(status);
  let submitting = false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) return;
    status.textContent = "";

    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const value = (name) => String(data.get(name) || "").trim();
    const nome = value("nome");
    const whatsapp = value("whatsapp").replace(/\D/g, "");
    const email = value("email");
    const papel = value("papel");
    const condominio = value("condominio");

    if (!nome || !whatsapp || !condominio) {
      status.textContent = "Preencha seu nome, WhatsApp e o nome do condomínio.";
      return;
    }
    if (whatsapp.length < 10 || whatsapp.length > 15) {
      status.textContent = "Informe um WhatsApp válido com DDD.";
      form.querySelector('[name="whatsapp"]')?.focus();
      return;
    }
    if (!papel) {
      status.textContent = "Selecione qual é o seu papel no condomínio.";
      form.querySelector(".custom-select__trigger")?.focus();
      return;
    }

    const payload = {
      nome,
      whatsapp,
      ...(email ? { email } : {}),
      origem: "Formulário de cotação — Âncora Condomínios",
      extra_fields: { papel, condominio },
    };
    const originalText = submitButton.textContent;
    submitting = true;
    submitButton.disabled = true;
    submitButton.textContent = "ENVIANDO...";
    form.setAttribute("aria-busy", "true");

    try {
      const response = await fetch(LINYT_CAPTURE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.ok === false) {
        throw new Error(result.message || "Não foi possível enviar. Tente novamente.");
      }

      form.reset();
      form.querySelector('[name="papel"]').value = "";
      form.querySelector(".custom-select__text").textContent = "Qual é o seu papel no condomínio?";
      form.querySelector("[data-select]").classList.remove("is-open");
      form.querySelector(".custom-select__trigger").setAttribute("aria-expanded", "false");
      form.querySelectorAll(".custom-select__option").forEach((option) => {
        option.classList.remove("is-selected");
        option.setAttribute("aria-selected", "false");
      });
      status.textContent = "Solicitação enviada com sucesso! Em breve entraremos em contato.";
    } catch (error) {
      status.textContent = error instanceof TypeError
        ? "Não foi possível conectar. Tente novamente em instantes."
        : error.message || "Não foi possível enviar. Tente novamente.";
    } finally {
      submitting = false;
      submitButton.disabled = false;
      submitButton.textContent = originalText;
      form.removeAttribute("aria-busy");
    }
  });
});

const selectComponents = document.querySelectorAll("[data-select]");

const closeAllSelects = (currentSelect) => {
  selectComponents.forEach((select) => {
    if (select !== currentSelect) {
      select.classList.remove("is-open");
      select.querySelector(".custom-select__trigger")?.setAttribute("aria-expanded", "false");
    }
  });
};

selectComponents.forEach((select) => {
  const trigger = select.querySelector(".custom-select__trigger");
  const hiddenInput = select.querySelector('input[type="hidden"]');
  const label = select.querySelector(".custom-select__text");
  const options = select.querySelectorAll(".custom-select__option");

  if (!trigger || !hiddenInput || !label || !options.length) {
    return;
  }

  options.forEach((option) => {
    option.setAttribute("aria-selected", "false");
  });

  trigger.addEventListener("click", () => {
    const isOpen = select.classList.contains("is-open");
    closeAllSelects(select);
    select.classList.toggle("is-open", !isOpen);
    trigger.setAttribute("aria-expanded", String(!isOpen));
  });

  options.forEach((option) => {
    option.addEventListener("click", () => {
      options.forEach((item) => {
        item.classList.remove("is-selected");
        item.setAttribute("aria-selected", "false");
      });

      option.classList.add("is-selected");
      option.setAttribute("aria-selected", "true");
      hiddenInput.value = option.dataset.value || option.textContent.trim();
      label.textContent = option.textContent.trim();
      select.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    });
  });
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("[data-select]")) {
    closeAllSelects(null);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAllSelects(null);
  }
});

const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) {
      return;
    }

    faqItems.forEach((otherItem) => {
      if (otherItem !== item) {
        otherItem.open = false;
      }
    });
  });
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  document.body.classList.add("reduced-motion");
}

const leadForm = document.querySelector("#formulario");
const formScrollTriggers = document.querySelectorAll('a[href="#formulario"]');
let formPulseTimeoutId = 0;

const pulseLeadForm = () => {
  if (!leadForm) {
    return;
  }

  leadForm.classList.remove("is-targeted");
  void leadForm.offsetWidth;
  leadForm.classList.add("is-targeted");
};

leadForm?.addEventListener("animationend", () => {
  leadForm.classList.remove("is-targeted");
});

formScrollTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    if (!leadForm) {
      return;
    }

    event.preventDefault();

    const topbarInner = document.querySelector(".topbar__inner");
    const topOffset = (topbarInner?.getBoundingClientRect().height || 0) + 70;
    const targetY = Math.max(leadForm.getBoundingClientRect().top + window.scrollY - topOffset, 0);
    const scrollDistance = Math.abs(targetY - window.scrollY);
    const pulseDelay = prefersReducedMotion
      ? 0
      : Math.min(1200, Math.max(520, 260 + scrollDistance * 0.22));

    window.scrollTo({
      top: targetY,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });

    window.clearTimeout(formPulseTimeoutId);
    formPulseTimeoutId = window.setTimeout(() => {
      pulseLeadForm();
    }, pulseDelay);
  });
});

const revealGroups = [
  { selector: ".diag-card", direction: "up", step: 110 },
  { selector: ".trust-stat", direction: "up", step: 110 },
  { selector: ".process-item", direction: "up", step: 100 },
  { selector: ".faq-item", direction: "up", step: 80 },
  { selector: ".outlined-card--center", direction: "scale", step: 0 },
  { selector: ".outlined-card--process", direction: "scale", step: 0 },
  { selector: ".patrimony-card__media", direction: "left", step: 0 },
  { selector: ".patrimony-card__panel--content", direction: "right", step: 110 },
  { selector: ".closing-cta__inner", direction: "scale", step: 0 },
];

const revealItems = [];

revealGroups.forEach((group) => {
  const elements = [...document.querySelectorAll(group.selector)];

  elements.forEach((element, index) => {
    element.classList.add("reveal-item", `reveal-item--${group.direction}`);
    element.style.setProperty("--reveal-delay", `${index * group.step}ms`);
    revealItems.push(element);
  });
});

if (revealItems.length) {
  if (prefersReducedMotion) {
    revealItems.forEach((element) => {
      element.classList.add("is-revealed");
    });
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    revealItems.forEach((element) => {
      revealObserver.observe(element);
    });
  }
}

const countUpElements = [...document.querySelectorAll("[data-count-up]")];
let countSequenceStarted = false;
const countDuration = 2200;
const countOverlapDelay = countDuration * 0.5;

const formatCountValue = (value) => new Intl.NumberFormat("pt-BR").format(value);

const renderCountValue = (element, value) => {
  const prefix = element.dataset.countPrefix || "";
  const suffix = element.dataset.countSuffix || "";
  element.textContent = `${prefix}${formatCountValue(value)}${suffix}`;
};

const completeFeaturedStat = (element) => {
  const featuredStat = element.closest(".trust-stat--featured");

  if (featuredStat) {
    featuredStat.classList.add("is-complete");
  }
};

const animateCountUp = (element) => {
  if (element.dataset.countAnimated === "true") {
    return;
  }

  const target = Number.parseInt(element.dataset.countTarget || "0", 10);

  if (!Number.isFinite(target) || target < 0) {
    return;
  }

  element.dataset.countAnimated = "true";

  const startTime = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - startTime) / countDuration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(target * eased);

    renderCountValue(element, currentValue);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      renderCountValue(element, target);
      completeFeaturedStat(element);
    }
  };

  requestAnimationFrame(tick);
};

const animateCountSequence = (elements) => {
  if (countSequenceStarted) {
    return;
  }

  countSequenceStarted = true;

  elements.forEach((element, index) => {
    window.setTimeout(() => {
      animateCountUp(element);
    }, index * countOverlapDelay);
  });
};

if (countUpElements.length) {
  countUpElements.forEach((element) => {
    if (prefersReducedMotion) {
      const target = Number.parseInt(element.dataset.countTarget || "0", 10);
      renderCountValue(element, target);
      element.dataset.countAnimated = "true";
      completeFeaturedStat(element);
      return;
    }

    renderCountValue(element, 0);
  });

  if (!prefersReducedMotion) {
    const sequenceTrigger = countUpElements[0]?.closest(".trust__panel") || countUpElements[0];
    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          animateCountSequence(countUpElements);
          currentObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.35,
      }
    );

    if (sequenceTrigger) {
      observer.observe(sequenceTrigger);
    }
  }
}

const timeline = document.querySelector(".timeline");
const timelineItems = timeline ? [...timeline.querySelectorAll(".timeline__item")] : [];
let timelineAnimationStarted = false;
const timelineDuration = 1900;
const timelineRevealDelay = 650;

const setTimelineComplete = () => {
  if (!timeline) {
    return;
  }

  timeline.classList.remove("is-pending", "is-animating");
  timeline.classList.add("is-complete");
  timeline.style.setProperty("--timeline-progress", "1");
  timelineItems.forEach((item) => {
    item.classList.add("is-revealed");
  });
};

const animateTimelineLine = () => {
  if (!timeline) {
    return;
  }

  const startTime = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - startTime) / timelineDuration, 1);
    const eased = 1 - Math.pow(1 - progress, 2.2);

    timeline.style.setProperty("--timeline-progress", String(eased));

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      setTimelineComplete();
    }
  };

  requestAnimationFrame(tick);
};

const startTimelineSequence = () => {
  if (!timeline || timelineAnimationStarted) {
    return;
  }

  timelineAnimationStarted = true;

  if (prefersReducedMotion) {
    setTimelineComplete();
    return;
  }

  timeline.classList.remove("is-pending");
  timeline.classList.add("is-animating");

  timelineItems.forEach((item, index) => {
    window.setTimeout(() => {
      item.classList.add("is-revealed");
    }, index * timelineRevealDelay + 60);
  });

  animateTimelineLine();
};

if (timeline && timelineItems.length) {
  if (prefersReducedMotion) {
    setTimelineComplete();
  } else {
    timeline.classList.add("is-pending");
    timeline.style.setProperty("--timeline-progress", "0");

    const timelineObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          startTimelineSequence();
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.32,
      }
    );

    timelineObserver.observe(timeline);
  }
}
