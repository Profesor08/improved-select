import { arrayEqual } from "./utils";

type ImprovedSelectInfo = {
  isActive: boolean;
  isSearchActive: boolean;
  isSelected: boolean;
  element: HTMLElement;
  select: HTMLSelectElement | null;
};
type ImprovedSelectEventType = "open" | "close" | "toggle" | "change";
type ImprovedSelectEventListener = (info: ImprovedSelectInfo) => void;

export class ImprovedSelect {
  private isActive = false;
  private isSearchActive = false;
  private isSelected = false;
  private toggleElements: HTMLElement[] = [];
  private closeElements: HTMLElement[] = [];
  private events: {
    [key in ImprovedSelectEventType]: ImprovedSelectEventListener[];
  } = {
    open: [],
    close: [],
    toggle: [],
    change: [],
  };
  private select: HTMLSelectElement | null;
  private selectBody: HTMLSelectElement | null;
  private searchInput: HTMLSelectElement | null;
  private linkedOptions: HTMLElement[] = [];
  private selectedValueElements: HTMLElement[] = [];
  private initialSelection: number[] = [];
  private defaultSelection: number[] = [];
  private isHtmlValue: boolean = false;
  public static improvedSelectElements: ImprovedSelect[] = [];

  constructor(private element: HTMLElement) {
    this.isActive = this.element.classList.contains("is-active");
    this.isHtmlValue = this.element.hasAttribute("data-select-html-value");
    this.toggleElements = Array.from(
      this.element.querySelectorAll("[data-select-toggle]"),
    );
    this.closeElements = Array.from(
      this.element.querySelectorAll("[data-select-close]"),
    );
    this.select = this.element.querySelector("select");
    this.linkedOptions = Array.from(
      this.element.querySelectorAll("[data-select-option]"),
    );
    this.selectedValueElements = Array.from(
      this.element.querySelectorAll("[data-select-value]"),
    );
    this.selectBody = this.element.querySelector("[data-select-body]");
    this.searchInput = this.element.querySelector("[data-select-search]");
    this.initToggleBehavior();
    this.initCloseBehavior();
    this.initSelectBehavior();
    this.initSearchBehavior();
    this.initChangeStateBehavior();
    this.updateActiveState();
    this.element.setAttribute("data-improved-select", "initialized");
    this.element.classList.toggle(
      "is-multiple",
      this.select?.multiple === true,
    );
    ImprovedSelect.improvedSelectElements.push(this);
  }

  private initChangeStateBehavior() {
    if (this.select) {
      for (const option of Array.from(this.select.selectedOptions)) {
        this.initialSelection.push(option.index);
      }

      for (const option of Array.from(this.select.options)) {
        if (option.hasAttribute("data-select-default")) {
          this.defaultSelection.push(option.index);
        }
      }

      if (
        this.defaultSelection.length === 0 &&
        this.select.options.length > 0
      ) {
        this.defaultSelection.push(0);
      }
    }
  }

  private initToggleBehavior() {
    this.toggleElements.forEach((toggleElement) => {
      toggleElement.addEventListener("click", () => {
        if (this.isActive) {
          this.close();
        } else {
          this.toggle();
        }
      });
    });

    if (this.element.hasAttribute("data-improved-select-modal") === false) {
      this.on("toggle", () => {
        this.fixBodyVisibility();
      });
    }
  }

  private initCloseBehavior() {
    this.closeElements.forEach((closeElement) => {
      closeElement.addEventListener("click", () => {
        this.close();
      });
    });
  }

  private initSelectBehavior() {
    this.linkedOptions.forEach((linkedOption, index) => {
      linkedOption.addEventListener("click", () => {
        if (this.select && this.select.options[index]) {
          const option = this.select.options[index];

          option.selected = !option.selected;

          this.select.dispatchEvent(new Event("change"));
        }

        if (this.select === null || this.select.multiple === false) {
          this.close();
        }
      });
    });

    if (this.select) {
      this.select.addEventListener("change", () => {
        this.dispatch("change");
      });
    }

    this.on("change", () => {
      this.updateActiveState();
    });
  }

  private initSearchBehavior() {
    if (this.searchInput) {
      this.searchInput.addEventListener("input", () => {
        this.updateSearchState();
      });

      this.updateSearchState();
    }

    this.on("toggle", () => {
      this.resetSearchState();
    });
  }

  private updateActiveState() {
    if (this.select) {
      const selectedOptions = Array.from(this.select.selectedOptions);

      const selectedValuesText = this.isHtmlValue
        ? selectedOptions
            .map((option) => this.linkedOptions[option.index]?.innerHTML)
            .join(", ")
        : selectedOptions.map((option) => option.innerHTML).join(", ");

      this.isSelected = this.element.classList.toggle(
        "is-selected",
        selectedOptions.length > 0,
      );

      this.selectedValueElements.forEach((selectedValueElement) => {
        selectedValueElement.innerHTML = selectedValuesText;
      });

      this.linkedOptions.forEach((option, id) => {
        if (this.select) {
          option.classList.toggle(
            "is-active",
            selectedOptions.some(
              (opt) => opt.disabled === false && opt.index === id,
            ),
          );

          option.classList.toggle(
            "is-disabled",
            selectedOptions.some(
              (opt) => opt.disabled === true && opt.index === id,
            ),
          );
        }
      });

      this.element.classList.toggle(
        "is-changed",
        arrayEqual(
          this.defaultSelection,
          selectedOptions.map((option) => option.index),
        ) === false,
      );
    }
  }

  private updateSearchState() {
    if (this.searchInput) {
      const searchValue = this.searchInput.value.trim();

      this.isSearchActive = this.element.classList.toggle(
        "is-search-active",
        searchValue.length > 0,
      );

      if (this.select) {
        Array.from(this.select.options).forEach((option, index) => {
          if (this.linkedOptions[index]) {
            const valueMatch =
              searchValue.length > 0
                ? this.searchInString(option.value, searchValue)
                : false;

            const textMatch =
              searchValue.length > 0
                ? this.searchInString(option.innerText, searchValue)
                : false;

            this.linkedOptions[index].classList.toggle(
              "is-hidden",
              searchValue.length > 0 &&
                valueMatch !== true &&
                textMatch !== true,
            );
          }
        });
      }
    }
  }

  private searchInString(target: string, value: string): boolean {
    const searchTarget = target.toLocaleLowerCase();
    const searchValue = value.toLocaleLowerCase();

    return searchValue.split(/[\s]+/).some((str) => searchTarget.includes(str));
  }

  private resetSearchState() {
    if (this.searchInput) {
      this.searchInput.value = "";
      this.searchInput.dispatchEvent(new Event("input"));
    }
  }

  private fixBodyVisibility() {
    if (this.selectBody) {
      if (this.isActive) {
        const { left, width } = this.selectBody.getBoundingClientRect();
        const scrollBarWidth = window.innerWidth - document.body.clientWidth;
        const offset = window.innerWidth - (left + width + 16 + scrollBarWidth);

        this.selectBody.style.transform = `translate(${Math.min(
          offset,
          0,
        )}px, 0)`;
      } else {
        this.selectBody.removeAttribute("style");
      }
    }
  }

  info(): ImprovedSelectInfo {
    return {
      isActive: this.isActive,
      isSearchActive: this.isSearchActive,
      isSelected: this.isSelected,
      element: this.element,
      select: this.select,
    };
  }

  toggle(force?: boolean) {
    this.isActive = this.element.classList.toggle("is-active", force);
    if (this.element.hasAttribute("data-improved-select-modal")) {
      document.body.classList.toggle("no-scroll", this.isActive);
    }
    this.dispatch("toggle");
  }

  open() {
    if (this.isActive === false) {
      this.toggle(true);
      this.dispatch("open");
    }
  }

  close() {
    if (this.isActive) {
      this.toggle(false);
      this.dispatch("close");
    }
  }

  on(type: ImprovedSelectEventType, listener: ImprovedSelectEventListener) {
    this.events[type].push(listener);
  }

  off(type: ImprovedSelectEventType, listener: ImprovedSelectEventListener) {
    this.events[type] = this.events[type].filter((l) => l !== listener);
  }

  dispatch(type: ImprovedSelectEventType) {
    this.events[type].forEach((listener) => {
      listener(this.info());
    });
  }

  reset() {
    if (this.select) {
      Array.from(this.select.options).forEach((option) => {
        option.selected = false;
      });

      for (const index of this.initialSelection) {
        if (this.select.options[index] !== undefined) {
          this.select.options[index].selected = true;
        }
      }

      this.select.dispatchEvent(new Event("change"));
    }
  }

  static create(element: HTMLElement) {
    return new this(element);
  }

  static initAllAvailableOnPage() {
    document
      .querySelectorAll<HTMLElement>(
        `[data-improved-select]:not([data-improved-select="initialized"])`,
      )
      .forEach((element) => {
        ImprovedSelect.create(element);
      });
  }

  static getInstance(element: HTMLElement): ImprovedSelect {
    const instance = ImprovedSelect.improvedSelectElements.find(
      (select) => select.info().element === element,
    );

    if (instance === undefined) {
      return ImprovedSelect.create(element);
    }

    return instance;
  }

  public static blurSimulationHandler(event: MouseEvent | TouchEvent) {
    ImprovedSelect.improvedSelectElements.forEach((improvedSelectElement) => {
      const { element, isActive } = improvedSelectElement.info();

      if (
        isActive === true &&
        element.contains(event.target as Node) === false
      ) {
        improvedSelectElement.close();
      }
    });
  }
}

document.addEventListener("mousedown", (event) => {
  ImprovedSelect.blurSimulationHandler(event);
});

document.addEventListener("touchstart", (event) => {
  ImprovedSelect.blurSimulationHandler(event);
});
