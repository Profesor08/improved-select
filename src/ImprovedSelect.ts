import { EventEmitter } from "@prof-dev/event-emitter";
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  Placement,
  shift,
  Strategy,
} from "@floating-ui/dom";
import { isEqual } from "lodash";

type ImprovedSelectInfo = {
  isActive: boolean;
  isSearchActive: boolean;
  isSelected: boolean;
  element: HTMLElement;
  select: HTMLSelectElement | null;
};
type SelectEventType = "open" | "close" | "toggle" | "change";
type SelectOptions = Partial<{
  placement?: Placement;
  strategy?: Strategy;
  style?: () => Record<string, string>;
}>;

const improvedSelectElementsMap = new Map<HTMLElement, ImprovedSelect>();

class Select extends EventEmitter<SelectEventType, ImprovedSelect> {}

export class ImprovedSelect extends Select {
  private isActive = false;
  private isSearchActive = false;
  private isSelected = false;
  private toggleElements: HTMLElement[] = [];
  private activeToggleElement?: HTMLElement;
  private closeElements: HTMLElement[] = [];
  public readonly select: HTMLSelectElement | null;
  private selectBody: HTMLElement | null;
  private searchInput: HTMLInputElement | null;
  private linkedOptions: HTMLElement[] = [];
  private selectLabel: string | undefined = undefined;
  private selectedValueElements: HTMLElement[] = [];
  private initialSelection: number[] = [];
  private defaultSelection: number[] = [];
  private isHtmlValue: boolean = false;
  private options: SelectOptions = {};
  private selectObserver: MutationObserver;
  private cleanup?: () => void;

  constructor(
    public readonly element: HTMLElement,
    options: SelectOptions = {},
  ) {
    super();

    this.options = {
      ...this.options,
      ...options,
    };
    this.selectObserver = new MutationObserver(this.onSelectAttributesChange);

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
    this.selectLabel = this.selectedValueElements[0]?.innerHTML;
    this.selectBody = this.element.querySelector("[data-select-body]");
    this.searchInput = this.element.querySelector("[data-select-search]");
    this.initToggleBehavior();
    this.initCloseBehavior();
    this.initLinkedOptions();
    this.initSelectBehavior();
    this.initSearchBehavior();
    this.initChangeStateBehavior();
    this.initResetBehavior();
    this.updateActiveState();
    this.onSelectAttributesChange();
    this.element.setAttribute("data-improved-select", "initialized");
    improvedSelectElementsMap.set(element, this);
  }

  private onSelectAttributesChange = () => {
    this.element.classList.toggle(
      "is-disabled",
      this.select?.disabled === true,
    );
    this.element.classList.toggle(
      "is-multiple",
      this.select?.multiple === true,
    );
  };

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
        this.select.options.length > 0 &&
        this.select.multiple === false
      ) {
        this.defaultSelection.push(0);
      }
    }
  }

  private initToggleBehavior() {
    this.toggleElements.forEach((toggleElement) => {
      toggleElement.addEventListener("click", () => {
        this.activeToggleElement = toggleElement;

        if (this.isActive === true) {
          this.close();
        } else {
          this.toggle();
        }
      });
    });
  }

  private initCloseBehavior() {
    this.closeElements.forEach((closeElement) => {
      closeElement.addEventListener("click", () => {
        this.close();
      });
    });
  }

  private initSelectBehavior() {
    if (this.select) {
      this.select.addEventListener("change", () => {
        this.dispatch("change", this);
      });

      this.selectObserver.observe(this.select, {
        attributes: true,
      });
    }

    this.on("change", () => {
      this.updateActiveState();
    });
  }

  private initLinkedOptions() {
    this.linkedOptions.forEach((linkedOption, index) => {
      const value = this.select?.options[index]?.value;
      linkedOption.dataset.selectOption = value;
      linkedOption.removeEventListener("click", this.onLinkedOptionClick);
      linkedOption.addEventListener("click", this.onLinkedOptionClick);
    });
  }

  private onLinkedOptionClick = (event: MouseEvent) => {
    const linkedOption = event.currentTarget as HTMLElement;
    const value = linkedOption.dataset.selectOption;
    const option = Array.from(this.select?.options ?? []).find(
      (option) => option.value === value,
    );

    if (option !== undefined) {
      if (this.select?.multiple === true) {
        option.selected = !option.selected;
      } else {
        option.selected = true;
      }
    }

    this.select?.dispatchEvent(
      new Event("change", {
        bubbles: true,
      }),
    );

    if (this.select?.multiple === false) {
      this.close();
    }
  };

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

  private initResetBehavior() {
    if (this.select) {
      this.select.addEventListener("reset", this.reset);
    }
  }

  private updateActiveState() {
    if (this.select) {
      const selectedOptions = Array.from(this.select.selectedOptions);

      const selectedValuesText =
        selectedOptions.length > 0
          ? this.isHtmlValue
            ? selectedOptions
                .map((option) => this.linkedOptions[option.index]?.innerHTML)
                .join(", ")
            : selectedOptions.map((option) => option.innerHTML).join(", ")
          : this.selectLabel ?? "";

      this.isSelected = this.element.classList.toggle(
        "is-selected",
        selectedOptions.length > 0,
      );

      this.selectedValueElements.forEach((selectedValueElement) => {
        selectedValueElement.innerHTML = selectedValuesText;
      });

      this.linkedOptions.forEach((linkedOption, index) => {
        if (this.select) {
          const isActive = selectedOptions.some(
            (opt) => opt.disabled === false && opt.index === index,
          );

          linkedOption.classList.toggle("is-active", isActive);

          this.updateDisabledOptions();
        }
      });

      this.element.classList.toggle(
        "is-changed",
        isEqual(
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
          const linkedOption = this.linkedOptions[index];

          if (linkedOption !== undefined) {
            const valueMatch =
              searchValue.length > 0
                ? this.searchInString(option.value, searchValue)
                : false;

            const textMatch =
              searchValue.length > 0
                ? this.searchInString(option.innerText, searchValue)
                : false;

            linkedOption.classList.toggle(
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

  public updateOptions() {
    this.linkedOptions = Array.from(
      this.element.querySelectorAll("[data-select-option]"),
    );

    this.initLinkedOptions();
  }

  public info(): ImprovedSelectInfo {
    return {
      isActive: this.isActive,
      isSearchActive: this.isSearchActive,
      isSelected: this.isSelected,
      element: this.element,
      select: this.select,
    };
  }

  private update = async () => {
    if (this.activeToggleElement !== undefined && this.selectBody !== null) {
      const { x, y } = await computePosition(
        this.activeToggleElement,
        this.selectBody,
        {
          strategy: this.options.strategy,
          placement: this.options.placement,
          middleware: [offset(8), flip(), shift({ padding: 12 })],
        },
      );

      Object.assign(this.selectBody.style, {
        left: `${x}px`,
        top: `${y}px`,
        ...this.options.style?.(),
      });
    }
  };

  public toggle(force?: boolean) {
    this.cleanup?.();
    this.isActive = this.element.classList.toggle("is-active", force);

    if (
      this.isActive === true &&
      this.activeToggleElement !== undefined &&
      this.selectBody !== null
    ) {
      this.cleanup = autoUpdate(
        this.activeToggleElement,
        this.selectBody,
        this.update,
      );
    }

    this.dispatch("toggle", this);
  }

  public open() {
    if (this.isActive === false) {
      this.toggle(true);
      this.dispatch("open", this);
    }
  }

  public close() {
    if (this.isActive === true) {
      this.toggle(false);
      this.dispatch("close", this);
    }
  }

  public updateDisabledOptions() {
    if (this.select) {
      const options = Array.from(this.select.options);

      this.linkedOptions.forEach((linkedOption, index) => {
        if (this.select) {
          const isDisabled = options[index]?.disabled === true;

          linkedOption.classList.toggle("is-disabled", isDisabled);
        }
      });
    }
  }

  public reset = () => {
    if (this.select) {
      Array.from(this.select.options).forEach((option) => {
        option.selected = false;
      });

      for (const index of this.defaultSelection) {
        const option = this.select.options[index];

        if (option !== undefined) {
          option.selected = true;
        }
      }

      this.select.dispatchEvent(
        new Event("change", {
          bubbles: true,
        }),
      );
    }
  };

  public clear() {
    if (this.select) {
      Array.from(this.select.options).forEach((option) => {
        option.selected = false;
      });

      this.select.dispatchEvent(
        new Event("change", {
          bubbles: true,
        }),
      );
    }
  }

  public getSelectedOptions(): HTMLOptionElement[] {
    return Array.from(this.select?.selectedOptions ?? []);
  }

  static create(
    element: HTMLElement,
    options: SelectOptions = {},
  ): ImprovedSelect {
    const instance = improvedSelectElementsMap.get(element);

    if (instance !== undefined) {
      return instance;
    }

    return new ImprovedSelect(element, options);
  }

  static initAllAvailableOnPage(options: SelectOptions = {}) {
    document
      .querySelectorAll<HTMLElement>(
        `[data-improved-select]:not([data-improved-select="initialized"])`,
      )
      .forEach((element) => {
        ImprovedSelect.create(element, options);
      });
  }

  static getInstance(element: HTMLElement | null): ImprovedSelect | undefined {
    if (element == null) {
      return undefined;
    }

    return improvedSelectElementsMap.get(element);
  }

  public static blurSimulationHandler(event: MouseEvent | TouchEvent) {
    for (const [_, improvedSelect] of improvedSelectElementsMap) {
      const { element, isActive } = improvedSelect.info();

      if (
        isActive === true &&
        element.contains(event.target as Node) === false
      ) {
        improvedSelect.close();
      }
    }
  }
}

document.addEventListener("mousedown", (event) => {
  ImprovedSelect.blurSimulationHandler(event);
});

document.addEventListener("touchstart", (event) => {
  ImprovedSelect.blurSimulationHandler(event);
});
