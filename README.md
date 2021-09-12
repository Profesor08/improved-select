# improved-select

Custom select library allowing you to use any custom layout & behavior you like

## Installation

```sh
npm i @prof-dev/improved-select
```

### Usage

```typescript
import { ImprovedSelect } from "@prof-dev/improved-select";

ImprovedSelect.initAllAvailableOnPage();
```

```html
<div class="improved-select select-regular" data-improved-select>
  <select multiple hidden>
    <option value="value-1">Select value 1</option>
    <option value="value-2">Select value 2</option>
    <option value="value-3">Select value 3</option>
    <option value="value-4">Select value 4</option>
    <option value="value-5">Select value 5</option>
    <option value="value-6">Select value 6</option>
    <option value="value-7">Select value 7</option>
    <option value="value-8">Select value 8</option>
    <option value="value-9">Select value 9</option>
    <option value="value-10">Select value 10</option>
    <option value="value-11">Select value 11</option>
    <option value="value-12">Select value 12</option>
    <option value="value-13">Select value 13</option>
    <option value="value-14">Select value 14</option>
    <option value="value-15">Select value 15</option>
  </select>
  <div class="select-header" data-select-toggle>
    <div class="select-icon">😀</div>
    <div class="select-value">
      <div data-select-value></div>
      <div class="select-placeholder">Search / Multiple</div>
    </div>
    <div class="select-arrow">&dtrif;</div>
  </div>
  <div class="select-body" data-select-body>
    <div class="select-search">
      <div class="search-icon">🔍</div>
      <input
        type="text"
        class="search-input"
        placeholder="Search reply"
        data-select-search
      />
    </div>
    <div class="select-menu">
      <div class="select-menu-item" data-select-option>Select value 1</div>
      <div class="select-menu-item" data-select-option>Select value 2</div>
      <div class="select-menu-item" data-select-option>Select value 3</div>
      <div class="select-menu-item" data-select-option>Select value 4</div>
      <div class="select-menu-item" data-select-option>Select value 5</div>
      <div class="select-menu-item" data-select-option>Select value 6</div>
      <div class="select-menu-item" data-select-option>Select value 7</div>
      <div class="select-menu-item" data-select-option>Select value 8</div>
      <div class="select-menu-item" data-select-option>Select value 9</div>
      <div class="select-menu-item" data-select-option>Select value 10</div>
      <div class="select-menu-item" data-select-option>Select value 11</div>
      <div class="select-menu-item" data-select-option>Select value 12</div>
      <div class="select-menu-item" data-select-option>Select value 13</div>
      <div class="select-menu-item" data-select-option>Select value 14</div>
      <div class="select-menu-item" data-select-option>Select value 15</div>
    </div>
  </div>
</div>
```
