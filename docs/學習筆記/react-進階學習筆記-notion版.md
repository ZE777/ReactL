# React 進階學習筆記

> 整理自學習對話：從「網頁基礎」到「兩年經驗水準」的 React 知識體系
> 適合對象：有 HTML/CSS/JS 與 .NET MVC 後端基礎，正在深入 React 框架的開發者

---

## 匯入 Notion 的步驟

### 1. 用 Import 功能（最推薦）

1. 開啟 Notion，左下角 **Settings** → **Import** → **Markdown & CSV**
2. 選擇本檔案（`.md`）
3. Notion 會建立一個新頁面，所有區塊（標題、表格、程式碼）都會正確轉換

### 2. 或者直接複製貼上

如果想用複製貼上的方式：

1. **不要從 VS Code 直接複製**（會夾帶程式碼編輯器的格式 metadata，導致整份被包進 code block）
2. 先把內容貼到記事本（Notepad）洗掉格式
3. 從記事本複製 → 貼到 Notion

| Markdown 語法 | Notion 區塊 |
| --- | --- |
| `#` `##` `###` | Heading 1 / 2 / 3 |
| 表格語法 `\| ... \|` | Table（原生表格） |
| 三個反引號 + 語言（如 jsx） | Code Block（含語法高亮） |
| `>` | Callout / Quote |
| `---` | Divider（分隔線） |
| `- ` 或 `1. ` | Bulleted / Numbered List |
| `**文字**` | 粗體 |

### 3. 建立可跳轉目錄

貼上完成後，將游標移到頁面頂部（或任一空白行），輸入 `/toc` 並選擇「**Table of contents**」區塊。Notion 會自動掃描整份文件所有 H1 / H2 / H3 標題，產生可點擊跳轉的目錄。

> Notion 不支援 Markdown anchor 連結（`[標題](#section)` 會失效），原生 `/toc` 區塊才能達成可跳轉目錄。

---

## 學習路徑建議

本文件分為 **9 個 Part、29 個章節**，建議照順序讀，因為後面的章節會依賴前面的知識。

但如果你時間有限，可以這樣選擇：

- **只有 1 小時**：Part 1（哲學）+ Part 3（時序）→ 建立核心思維
- **只有 3 小時**：Part 1、2、3、4 → 完整理解 hook 機制
- **5 小時進階**：Part 1 → 6，補完 hook 機制、效能與架構決策
- **完整路徑**：Part 1 → 9，從哲學一路到工程化、品質保證、SA 思維落地

如果你已經寫過幾個 React 專案，但常被「為什麼這樣寫不行」困擾，**Part 2（記憶體模型）和 Part 3（渲染時序）是你必須補的兩塊**；如果你已掌握 hook 機制，想往前端架構師發展，**Part 7（邏輯封裝）和 Part 9（工程化）是你的下一站**。

> 關於工程化的兩個專題（TailwindCSS 進階、Vitest 自動化測試），份量較大，獨立成 [TailwindCSS 進階學習筆記](tailwindcss-進階學習筆記.md) 與 [Vitest 自動化測試學習筆記](vitest-自動化測試學習筆記.md)，可搭配 Part 9 一起閱讀。

---

# Part 1：核心哲學

> 在動手寫 React 之前，先理解它的核心思想。為什麼資料驅動取代了 DOM 操作？為什麼堅持單向資料流？為什麼要有 Virtual DOM？這部分回答「為什麼是這樣」，理解了哲學，後面的 API 才會有意義。

---

## 1. 從操作 DOM 到資料驅動

### 觀念

傳統開發中我們會用 `document.getElementById` 抓元素並手動修改內容；React 完全反過來：**畫面是資料的結果，不是操作的結果**。

公式：

```text
UI = f(state)
```

開發者只負責「改資料」，React 負責「重畫畫面」。

### 兩個關鍵名詞

- **State（狀態）**：組件內部的私有資料，改變它畫面會自動更新
- **Props（屬性）**：從父組件傳下來的資料，類似函式參數，**唯讀**

### 與傳統開發的差異

| 傳統做法 | React 做法 |
| --- | --- |
| `document.getElementById('id').value = '新值'` | `setValue('新值')` |
| 開發者手動同步資料與畫面 | React 自動同步 |
| 容易出現「資料和畫面不一致」 | 畫面永遠是資料的投影 |

---

## 2. 單向資料流與受控組件

> 上一章講了「資料驅動」這個大方向。但具體到「畫面與資料如何雙向溝通」，React 選了一條與 Vue 截然不同的路。

### 核心觀念

React 的資料流是**單向**的，這是與 Vue 最大的哲學差異。

- **Vue（雙向綁定）**：`v-model` 一行搞定，輸入框打字變數自動變
- **React（單向 + 受控）**：必須手動處理「畫面回傳資料」

### React 中輸入框的兩步驟

```jsx
const [name, setName] = useState('');

<input
  value={name}
  onChange={e => setName(e.target.value)}
/>
```

- 步驟 1：`value={name}` 把資料綁到畫面上
- 步驟 2：`onChange` 監聽輸入，手動把畫面變動回寫到資料

### 為什麼 React 堅持單向？

- **明確性（Explicit）**：資料什麼時候變的、被誰改的，程式碼一目瞭然，除錯容易
- **可預測性**：畫面永遠是資料的投影。畫面錯了，必定是資料錯了，不會出現「不知道誰偷偷改了變數」的詭異情況

### 受控 vs 非受控組件

| 類型 | 資料管理者 | 使用工具 | 適用情境 |
| --- | --- | --- | --- |
| 受控（Controlled） | React | `useState` | 一般表單、需要驗證的輸入 |
| 非受控（Uncontrolled） | DOM | `useRef` | 超大型表單（效能考量）、整合傳統套件 |

> 兩年經驗者的判斷力：知道何時該堅持單向流的嚴謹，何時該為了效能或彈性跳脫框架。

---

## 3. Virtual DOM 與 Diffing 機制

> 「資料變了畫面就更新」聽起來簡單，但如果每次都重畫整個 DOM，效能會崩潰。Virtual DOM 是 React 解決這個問題的核心機制。

### 為什麼需要 Virtual DOM

直接操作真實 DOM 很慢。如果每次資料變動就重畫整個頁面，瀏覽器要做 layout、paint、reflow 等大量計算。

### React 的三步驟機制

1. **記憶體草圖（Virtual DOM）**：在記憶體中建立一份新的 UI 結構樹
2. **找茬遊戲（Diffing）**：比較「舊草圖」與「新草圖」哪裡不一樣
3. **精準打補丁（Patching）**：只更新真實 DOM 中差異的部分

### 比喻

> 傳統做法 = 想換一盞燈，把整個天花板拆了重裝
> React = 只拆掉那盞燈、換新的、裝回去

### key 屬性的重要性

在列表渲染時，`key` 是 React 進行 Diffing 的依據。錯誤的 key（例如使用陣列 index）會導致 React 誤判哪些項目移動、哪些是新增的，造成效能浪費或畫面異常。

```jsx
// 不推薦
items.map((item, index) => <Row key={index} data={item} />)

// 推薦
items.map(item => <Row key={item.id} data={item} />)
```

---

## 4. 與 .NET MVC 架構的映射

> 對於有後端 MVC 經驗的人，這個對照能幫助快速建立心智模型。

| MVC 角色 | React 對應 |
| --- | --- |
| Model | `state`（資料） |
| View | `render` / JSX（畫面） |
| Controller | 組件內的事件處理函式 + `setState` |

### 關鍵差異

- **傳統 MVC**：Model → View 的更新可能需要重整頁面或手動 AJAX 更新局部 DOM
- **React**：Model → View 的同步**完全自動化**且經過效能優化

---

# Part 2：JavaScript 記憶體模型

> React 的核心機制（淺比較、不可變更新）建立在 JavaScript 的物件記憶體模型之上。如果不先理解 `===` 對物件做什麼、為什麼修改物件屬性不會觸發更新，後面所有 hook 的「為什麼這樣寫」都會變成死記硬背。
>
> 這部分先講 JS 的底層特性（嚴格相等），再講 React 的應用（不可變性），最後補上實作細節（深淺拷貝）。

---

## 5. 嚴格相等對物件的判斷

### `===` 對不同型別的行為

| 型別 | 比較方式 | 範例 |
| --- | --- | --- |
| 基本型別（string, number, boolean） | 比較內容值 | `1 === 1` → `true` |
| 物件型別（Object, Array, Function） | 比較記憶體位址 | `{a:1} === {a:1}` → `false` |

### 為什麼這對 React 至關重要

```jsx
const obj1 = { a: 1 };
const obj2 = { a: 1 };
console.log(obj1 === obj2);  // false（不同位址）

const obj3 = obj1;
console.log(obj1 === obj3);  // true（同位址）
```

React 內部用的就是這個邏輯：

- 「內容相同但位址不同」會被視為「資料變了」
- 「位址相同但內容被偷改」會被視為「資料沒變」

> 記住這條規則，下一章「不可變性」就會自然而然成立。

---

## 6. 不可變性原則

> 既然 React 看的是位址而不是內容，那要怎麼正確地「告訴 React 資料變了」？答案就是：**永遠產生一個新位址**。

### React 的判斷邏輯

React 用 `Object.is(oldState, newState)` 判斷是否需要重新渲染。對物件而言，比的是**記憶體位址**，不是內容。

### 錯誤示範

```jsx
const [user, setUser] = useState({ name: '小明', age: 20 });

const updateName = () => {
  user.name = '子晴';   // 直接改屬性，記憶體位址沒變
  setUser(user);        // React：「資料沒變嘛」→ 不更新畫面
};
```

### 正確做法

```jsx
const updateName = () => {
  setUser({ ...user, name: '子晴' });  // 用展開運算子產生新物件、新位址
};
```

### 陣列同理

```jsx
// 錯誤：直接 push 不會換位址
list.push(newItem);
setList(list);

// 正確：產生新陣列
setList([...list, newItem]);
```

---

## 7. 淺拷貝 vs 深拷貝

> 上一章用 `{...obj}` 產生新位址，但這只解決「第一層」。如果物件是巢狀的（物件裡有物件），事情會變複雜。

### 淺拷貝（Shallow Copy）

- **特性**：只複製第一層。第一層是基本型別 → 複製值；第一層是物件 → 只複製記憶體位址
- **語法**：`{...obj}`、`[...arr]`、`Object.assign({}, obj)`
- **足以騙過 React**：因為第一層位址變了

```jsx
const original = { name: '小明', address: { city: '台北' } };
const shallow = { ...original };

shallow.name = '子晴';           // 不影響 original.name
shallow.address.city = '高雄';   // 影響 original.address.city！（共用同個 address 物件）
```

### 深拷貝（Deep Copy）

- **特性**：所有層級都產生新位址，完全切斷與原物件的聯繫
- **語法**：`JSON.parse(JSON.stringify(obj))`、`structuredClone(obj)`、`lodash.cloneDeep`

```jsx
const deep = JSON.parse(JSON.stringify(original));
deep.address.city = '高雄';      // 不影響 original
```

### 比喻

> **淺拷貝**：再打一把一模一樣的鑰匙給你。我們手中是不同鑰匙，但開的是同一個保險箱。你改保險箱內容，我也會看到。

> **深拷貝**：直接連保險箱帶內容物全部複製一份新的給你。你把你的保險箱炸了，我的還好好的。

### 何時要深拷貝？

- 巢狀物件需要完全獨立修改（例如 undo/redo 功能）
- 處理樹狀結構（如選單、權限樹）
- 一般的扁平資料避免用深拷貝，效能消耗較高

---

# Part 3：State 與渲染時序

> 現在進入第一個 Hook：`useState`。但在搞懂它的非同步特性之前，必須先看懂 React 的「渲染時序」——它是後續所有時序問題（為什麼 console 印舊值、useMemo 為什麼比 useEffect 快一拍）的解答。
>
> 最後補上 Class Component 的生命週期作為歷史脈絡，讓你看懂 `useEffect` 為什麼設計成這樣。

---

## 8. useState 的快照機制與批次更新

### 為什麼改了 state，馬上 console 卻是舊值？

```jsx
const [count, setCount] = useState(0);

const handleAdd = () => {
  setCount(count + 1);
  console.log(count); // 印出 0，不是 1！
};
```

### 兩個關鍵機制

#### A. 快照（Snapshot）

當 React 渲染組件時，就像對當前的 state「拍了一張照片」。在該次函式執行（例如 `handleAdd`）中，`count` 永遠是那張照片裡的 `0`。

`setCount(count + 1)` 的真正含意是：

> 請幫我準備下一張照片，那張照片裡的 count 要變成 1。

#### B. 批次更新（Batching）

React 會等整個事件處理函式執行完畢後，才統一進行重新渲染。這能避免每改一個變數就重畫一次畫面。

### 陷阱：連續呼叫 setCount

```jsx
const handleAdd = () => {
  setCount(count + 1);  // count 是 0，預約變 1
  setCount(count + 1);  // count 還是 0，預約變 1
  // 結果：count 最終是 1，不是 2
};
```

### 解法：Updater Function

```jsx
const handleAdd = () => {
  setCount(prev => prev + 1);  // 拿目前佇列中最新的值
  setCount(prev => prev + 1);  // 結果是 2
};
```

> 口訣：需要連續更新或基於前值計算時，永遠用 `prev =>` 寫法。

---

## 9. 渲染時序 Render Pipeline

> 上一章提到「事件處理完後才統一重畫」，這是「批次」的概念。但具體來說，React 一次渲染裡到底發生了什麼？什麼時候算 state、什麼時候寫 DOM、什麼時候跑 effect？這張時序圖就是後面所有 hook 行為的時間軸基準。

### 完整流程圖

```text
useState/useMemo 計算 → JSX 產出 → React 寫入 DOM → 畫面顯示 → useEffect 跑
       ↑                                                        ↑
   render 期間（同步）                                  render 之後（非同步）
```

### 三大階段

| 階段 | 名稱 | 工作內容 | 是否同步 |
| --- | --- | --- | --- |
| 1 | Render Phase | 計算 state、執行 `useMemo`、產出 JSX | 同步 |
| 2 | Commit Phase | 將計算結果寫入真實 DOM | 同步 |
| 3 | Passive Phase | 執行 `useEffect` | 非同步（畫面顯示後） |

### 這個時序圖能幫你解決的問題

- **為什麼 `useMemo` 在 render 內就拿得到值？** → 它在第 1 階段執行
- **為什麼 `useEffect` 看起來慢一拍？** → 它在第 3 階段，畫面顯示之後才跑
- **為什麼用 `useEffect` 設衍生值會閃爍？** → 第一次渲染顯示空值 → effect 跑 → setState → 再渲染一次

> 後面 Part 4（useEffect）和 Part 5（useMemo vs useEffect）的所有判斷，都在用這張時序圖。

---

## 10. Class Component 生命週期

> 雖然主流開發已轉向 Functional Component + Hooks，但 `useEffect` 的設計動機就是為了「整合 Class 生命週期的多個階段」。理解 Class 生命週期能幫你看懂 `useEffect` 為什麼長這樣，也方便維護舊專案。

### 三大階段

#### 掛載階段（Mounting）

組件被建立並插入 DOM 的過程：

| 方法 | 說明 |
| --- | --- |
| `constructor()` | 初始化 state、綁定事件 |
| `static getDerivedStateFromProps()` | 根據 props 更新 state（較少用） |
| `render()` | 必須實作，回傳 JSX |
| `componentDidMount()` | **最重要**。掛載完成後觸發，適合 API 請求、訂閱事件、操作 DOM |

#### 更新階段（Updating）

當 props 或 state 改變時：

| 方法 | 說明 |
| --- | --- |
| `shouldComponentUpdate(nextProps, nextState)` | 回傳 true/false 決定是否渲染。手動效能優化的關鍵 |
| `render()` | 重新計算 UI |
| `getSnapshotBeforeUpdate()` | DOM 更新前抓取資訊（如捲軸位置） |
| `componentDidUpdate(prevProps, prevState)` | 更新完成後觸發。適合根據 prop 變化重新打 API |

#### 卸載階段（Unmounting）

| 方法 | 說明 |
| --- | --- |
| `componentWillUnmount()` | 清理工作：清除計時器、取消 API 請求、移除事件監聽器 |

### 與 Hooks 的對應

```jsx
// componentDidMount
useEffect(() => {
  // 初始化
}, []);

// componentDidUpdate（針對特定 prop）
useEffect(() => {
  // data 變動時觸發
}, [data]);

// componentWillUnmount
useEffect(() => {
  return () => {
    // 清理
  };
}, []);

// 三者組合
useEffect(() => {
  // mount 與 update 共用邏輯
  return () => {
    // unmount 清理
  };
}, [data]);
```

> 看懂這個對應關係，下一章 `useEffect` 的三大模式就會「啊，原來如此」。

---

# Part 4：useEffect 與副作用管理

> `useEffect` 是 hook 中最容易踩坑的一個。它的三個常見問題——死循環、資源洩漏、競態錯亂——都源自同一個原因：使用者不熟悉它「事後執行」的本質（Part 3 第 9 章的 Passive Phase）。
>
> 這部分按「機制 → 陷阱 → 解法（清理）→ 兩個典型應用」的順序，讓你不再害怕寫 effect。

---

## 11. useEffect 三大模式

`useEffect` 用來處理**副作用（Side Effects）**：與渲染無關的外部互動。

### 副作用的範圍

- API 請求
- 手動修改 DOM（如 `document.title`）
- 設定計時器（`setTimeout`、`setInterval`）
- 訂閱事件（`addEventListener`）
- WebSocket 連線

### 三大模式（依相依性陣列區分）

#### A. 每次渲染後執行（無陣列）

```jsx
useEffect(() => {
  console.log('每次都會執行');
});
```

> 極少使用，效能消耗大。

#### B. 只執行一次（空陣列）

```jsx
useEffect(() => {
  fetchInitialData();
}, []);
```

- 等同 Class Component 的 `componentDidMount`
- 適合：初始 API 載入、Socket 連線

#### C. 特定資料變動時執行

```jsx
useEffect(() => {
  console.log('count 變動時執行');
}, [count]);
```

- 等同 Class Component 的 `componentDidUpdate`
- 適合：根據 ID 變化重新打 API、根據條件變化執行驗證

---

## 12. 死循環陷阱

> 相依性陣列控制 effect 何時執行，但若用錯就會卡進無限迴圈。這是寫 effect 第一個必須避開的坑。

### 經典錯誤範例

```jsx
const [count, setCount] = useState(0);

useEffect(() => {
  setCount(count + 1);  // 在 effect 中修改它正在監控的變數
}, [count]);
```

### 執行流程

1. 初次渲染：`count = 0`，執行 effect
2. `setCount(1)` 被呼叫
3. React 重新渲染（`count = 1`）
4. React 偵測到 `[count]` 變了，再次執行 effect
5. `setCount(2)` 被呼叫…
6. **無限迴圈，瀏覽器跳出 "Maximum update depth exceeded" 錯誤**

### 防範原則

> 永遠檢查相依性陣列：陣列裡的變數**不該在 effect 內部被無止盡修改**。

如果真的需要根據前值更新，改用 updater function 並移除相依：

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    setCount(prev => prev + 1);  // 不依賴外部 count
  }, 1000);
  return () => clearInterval(timer);
}, []); // 空陣列也安全
```

---

## 13. Cleanup Function 清理機制

> 上一個範例已經偷偷用了 `return () => clearInterval(timer)`。這就是 Cleanup —— 讓 effect 在「下次執行前」或「組件卸載前」釋放資源。它是寫穩定 React 應用的關鍵。

### 觀念

`useEffect` 可以回傳一個函式，這個函式會在「組件卸載前」或「下次 effect 執行前」被呼叫。它的角色類似 .NET 中的 `Dispose`。

### 基本範例

```jsx
useEffect(() => {
  const timer = setInterval(() => console.log('tick'), 1000);

  return () => {
    clearInterval(timer);  // Cleanup：清除計時器
  };
}, []);
```

### 為什麼必須清理

#### A. 避免重複訂閱

如果在 effect 裡 `window.addEventListener` 但不清理，每次組件重新渲染都會掛上一個新監聽器。100 次渲染後，事件觸發一次會跑 100 次處理函式。

#### B. 防止記憶體洩漏

組件已卸載但計時器還在跑，計時器持有對組件 state 的引用，造成記憶體無法回收。

#### C. 真正的資源釋放

WebSocket 連線、Chart.js 圖表實體、第三方套件等需要明確 dispose。

### 與 .NET EF Dispose 的對比

| 場景 | .NET EF | React useEffect |
| --- | --- | --- |
| 釋放對象 | DB 連線、實體追蹤 | 計時器、監聽器、訂閱、外部套件 |
| 觸發時機 | `using` 區塊結束 | 組件卸載或 effect 重執行前 |
| 不處理的後果 | 連線池耗盡、實體鎖死 | 記憶體洩漏、重複觸發、UI 異常 |

> 接下來兩章都是 Cleanup 的具體應用：事件監聽器（同步）與競態處理（非同步）。

---

## 14. 事件監聽器管理（Cleanup 應用 1）

### React 內部事件 vs 原生事件

| 類型 | 管理方式 |
| --- | --- |
| `<button onClick={...}>` | React 自動管理，不需手動清理 |
| `window.addEventListener(...)` | **必須在 cleanup 手動移除** |

### React 的合成事件機制

當你寫 `<button onClick={...}>`，React 並不會真的把事件綁在那個 button 上，而是統一綁在最頂層 root，靠事件冒泡攔截。這稱為 **Synthetic Event System**，自動解決了 jQuery 時代的：

- 動態生成元素事件失效問題
- 父子層綁定衝突
- 大量事件監聽器消耗記憶體

### 何時會發生「殘留」

- 在 `useEffect` 裡手動寫 `window.addEventListener` 卻沒清理
- 整合 jQuery 套件（如某些 DatePicker），它在 DOM 上掛了監聽，但 React 不知道要清
- 全域訂閱（WebSocket、自訂 EventEmitter）

### 規則總結

> JSX 標籤上寫的事件 → React 自動清理
> useEffect 裡手動掛的事件 → 自己負責清理

```jsx
useEffect(() => {
  const handleScroll = () => console.log(window.scrollY);
  window.addEventListener('scroll', handleScroll);

  return () => {
    window.removeEventListener('scroll', handleScroll);  // 必須移除
  };
}, []);
```

---

## 15. 競態競爭處理（Cleanup 應用 2）

### 情境

使用者快速操作，發出多個 API 請求。第二個請求先回來，第一個請求後回來，UI 可能顯示錯誤的舊資料。

### 兩種解法

#### 策略 A：UI 鎖定（防止觸發）

```jsx
<button disabled={isLoading} onClick={handleSubmit}>送出</button>
```

- **目的**：預防性。防止使用者手動觸發第二次
- **適用**：表單提交、結帳

#### 策略 B：旗標判斷（保護結果）

```jsx
useEffect(() => {
  let isIgnore = false;

  fetchData(id).then(res => {
    if (!isIgnore) {
      setData(res);  // 只有當這個 effect 還有效時才更新
    }
  });

  return () => {
    isIgnore = true;  // 標記舊請求為無效
  };
}, [id]);
```

- **目的**：保護性。解決回傳順序錯亂
- **適用**：搜尋框（連續打字）、切換分頁（連續切換）

#### 進階：AbortController（直接掐斷）

```jsx
useEffect(() => {
  const controller = new AbortController();

  fetch(url, { signal: controller.signal })
    .then(res => res.json())
    .then(setData)
    .catch(err => {
      if (err.name !== 'AbortError') console.error(err);
    });

  return () => controller.abort();  // 直接取消網路請求
}, [id]);
```

> 比旗標更徹底：不只忽略結果，連網路連線都直接斷開，節省頻寬。

---

# Part 5：衍生資料與效能優化

> Part 4 學會了「副作用」這個工具。但有些情況看似要用 `useEffect`，實則應該用 `useMemo`——例如「從現有資料推導出新值」。
>
> 這部分先教你**判斷該選哪一個**（先有判斷力，再學工具），再進到效能優化的三大法寶。

---

## 16. useMemo vs useEffect 的選用

### 核心問題

兩者都能監聽 `[data]`，但執行時機完全不同（回顧 Part 3 第 9 章的渲染時序圖）。

### 對比表

| 項目 | useMemo | useEffect |
| --- | --- | --- |
| 用途 | 計算衍生值（pure computation） | 執行副作用（side effect） |
| 時機 | render 過程中**同步**計算 | render 完成**之後**才跑 |
| 回傳 | 直接回傳值 | 沒有回傳值 |
| 是否需要額外 state | 不需要 | 需要搭配 `useState` 保存結果 |
| 渲染次數 | 一次完成 | 容易導致二次渲染 |

### 用實際場景感受差異

假設使用者輸入「台北市」要顯示對應縣市。

#### 用 useMemo（推薦）

```jsx
const derivedCity = useMemo(() => {
  return cityNames.find(c => value.startsWith(c)) || '';
}, [value, cityNames]);
```

流程：

```text
使用者打字 → render 開始 → 算出 derivedCity → 畫面顯示
（一輪 render 完成）
```

#### 用 useEffect（反模式）

```jsx
const [derivedCity, setDerivedCity] = useState('');
useEffect(() => {
  setDerivedCity(cityNames.find(c => value.startsWith(c)) || '');
}, [value, cityNames]);
```

流程：

```text
使用者打字 → render 開始 → derivedCity = '' → 畫面先顯示空 →
effect 跑 → setDerivedCity → 再 render 一次 → 畫面才顯示
（兩輪 render，中間有空白瞬間）
```

### 判斷準則

問自己：「這個動作的目的是什麼？」

- **算出畫面要顯示的值** → `useMemo`（甚至直接寫，輕量計算不需要包）
- **跟 React 之外的世界互動**（API、DOM、訂閱、計時器）→ `useEffect`

### 實戰範例：地址欄位推導

在地點選擇元件中，從一個完整地址字串（如「台北市信義區市府路 1 號」）推導出對應的縣市、行政區、詳細地址，這類純粹的「資料投影」就應該用 `useMemo`：

```jsx
const derivedCity = useMemo(() => {
  return cityNames.find(c => value.startsWith(c)) || '';
}, [value, cityNames]);

const derivedTown = useMemo(() => {
  if (!derivedCity) return '';
  const afterCity = value.slice(derivedCity.length);
  return townNames.find(t => afterCity.startsWith(t)) || '';
}, [derivedCity, value, townNames]);
```

這就是 React 官方說的 **derived state**：應該在 render 時直接算出來，而不是另存一份 state。

---

## 17. 效能優化三大法寶

> `useMemo` 除了避免「衍生值另存 state」，也能用來快取昂貴的計算。但效能優化是個三人組——`React.memo`、`useMemo`、`useCallback` 各守一個對象，要組合使用才有效。

### 工具總覽

| 工具 | 守護對象 | 解決的問題 |
| --- | --- | --- |
| `React.memo` | 整個組件 | 父組件更新導致子組件無謂重繪 |
| `useMemo` | 計算結果 | 避免重複執行高成本計算 |
| `useCallback` | 函式位址 | 避免函式被當成「新 prop」觸發子組件重繪 |

### React.memo

```jsx
const ExpensiveRow = React.memo(({ data }) => {
  return <tr>...</tr>;
});
```

**運作邏輯**：每次父組件渲染時，比較 `props` 的位址（回顧 Part 2 第 5 章的嚴格相等）。位址沒變就重用上次的渲染結果。

**何時該用**：

- 子組件渲染成本很高（複雜圖表、地圖、長列表）
- 父組件有「無關更新」會頻繁觸發（例如倒數計時器）

**何時不該用**：

- 子組件本身很輕（純文字、單一按鈕）
- 父組件很少更新

### useMemo

```jsx
const sortedList = useMemo(() => {
  return data.sort((a, b) => a.name.localeCompare(b.name));
}, [data]);
```

**運作邏輯**：在 render 期間執行，回傳計算結果。只要 `[data]` 沒變，就回傳上次快取的結果。

**何時該用**：

- 計算極度耗時（大量資料排序、過濾、正則匹配）
- 計算結果被 `React.memo` 子組件當作 prop 接收

**何時不該用**：

- 小量資料的簡單運算（直接寫即可，加 `useMemo` 反而多耗記憶體比較位址）

### useCallback

```jsx
const handleDelete = useCallback((id) => {
  setList(prev => prev.filter(item => item.id !== id));
}, []);
```

**運作邏輯**：保證函式的記憶體位址在依賴沒變時保持一致。

**為什麼需要**：

```jsx
// 沒用 useCallback
const Parent = () => {
  const [count, setCount] = useState(0);
  const handleClick = () => doSomething();  // 每次 render 都是新函式（新位址）

  return <ExpensiveChild onClick={handleClick} />;  // memo 失效
};
```

即使 `ExpensiveChild` 用了 `React.memo`，因為 `onClick` 每次都是新位址，淺比較會判定 `props` 變了，子組件還是會重繪。

```jsx
// 加上 useCallback
const handleClick = useCallback(() => doSomething(), []);
```

現在 `handleClick` 的位址固定，`React.memo` 才真的能擋住重繪。

### 比喻：身分證字號

> 沒用 useCallback：每次組件渲染，函式拿到新身分證字號（A → B → C）。

> 用了 useCallback：函式的身分證字號永遠是 A，子組件比對時知道「同一個人」。

### 兩年經驗者的心法

1. **不要預先優化**：先寫完，遇到效能問題用 React DevTools 定位
2. **三劍客是組合技**：`useCallback` 通常配合 `React.memo` 才有意義；單獨用 `useCallback` 可能毫無作用
3. **加了反而變慢的可能**：比較位址、維護快取本身也有成本，輕量場景反而是負擔

---

# Part 6：架構決策

> 當應用程式變大，你會遇到一個無法用 hook 解決的問題：**怎麼讓深層組件拿到頂層的資料？**這部分從 Prop Drilling 的痛點開始，討論 Context、Zustand、Custom Hook 各自的定位，並用實戰情境（Token、權限、版本檢查）讓你建立架構決策的判斷力。

---

## 18. Prop Drilling 與 Context API

### 什麼是 Prop Drilling

```text
App
 └─ Layout (locale)
     └─ Header (locale)
         └─ Nav (locale)
             └─ UserMenu (locale)
                 └─ Button ← 真正需要 locale
```

`locale` 必須像接力賽一樣穿過四層組件，儘管中間的 `Header`、`Nav` 根本不用這個資料。問題：

- 程式碼難維護
- 中間任一層忘了傳就壞掉
- 重構時牽一髮動全身

### Context API 的解法

Context 像是在應用程式中架設「廣播電台」：

```jsx
// 1. 建立 Context
const LocaleContext = createContext('zh-TW');

// 2. 在頂層 Provider 提供資料
<LocaleContext.Provider value={locale}>
  <App />
</LocaleContext.Provider>

// 3. 任何深層組件用 useContext 取用
const Button = () => {
  const locale = useContext(LocaleContext);
  return <button>{locale === 'zh-TW' ? '送出' : 'Submit'}</button>;
};
```

### 比喻

> 原本要一層層爬樓梯送快遞，現在直接蓋了一個傳送門。

### 與 .NET DI 的類比

- `Provider` 註冊資料 ≈ `Program.cs` 註冊服務
- `useContext` 取用 ≈ 建構子注入
- `Provider` 包覆位置 ≈ DI 的 Scope 範圍

### 效能陷阱

> Context 一旦變動，所有訂閱該 Context 的組件都會強制重繪。

**錯誤示範**：把 `theme` 和 `userList`（一萬筆）放進同一個 Context，改主題色會導致整個列表重繪。

**正確做法**：

- **職責分離**：theme 一個 Context、user 一個 Context、language 一個 Context
- **配合 useMemo**：傳給 `Provider` 的 `value` 要快取，避免每次渲染都產生新物件觸發無謂廣播

```jsx
const value = useMemo(() => ({ user, login, logout }), [user]);
return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
```

---

## 19. 全域狀態管理架構決策

> Context 雖然方便，但不是萬靈丹。實務上要根據資料的「更新頻率」、「存取範圍」、「是否需要在 React 之外讀取」來決定該用什麼工具。

### 三層分工

| 規模 | 工具 | 適用場景 |
| --- | --- | --- |
| 小（2-3 層） | 直接傳 Props | 一般功能開發 |
| 中（語系、主題、使用者資訊） | Context API | 低頻更新、高頻讀取的全域資料 |
| 大（複雜狀態、跨頁快取、需要在 React 外存取） | Zustand / Redux | 大型專案、需要 selector 細粒度訂閱 |

### 實戰：五個情境的設計方案

| 情境 | 建議方式 | 選用理由 |
| --- | --- | --- |
| 主題色 | Context API | 低頻更新、全站影響，與 React 生命週期結合最緊 |
| 語系 (i18n) | Context API | 同上，且主流 i18n 套件底層就是 Context |
| Token 狀態 | Zustand / Redux | 需要在 Axios 攔截器等「非 React 環境」存取 |
| 群組權限 | Context API | 結構化資料，登入時載入一次，提供 `hasPermission()` helper |
| 版本核對 | Custom Hook | 一次性行為，不需廣播給所有組件 |

### 為什麼 Token 不用 Context

如果 Token 只放在 Context，當你寫一個獨立的 `api.ts`（純 JS 檔，不是 React 組件）時，**拿不到 Token**。

Zustand 可以在任何地方呼叫 `useAuthStore.getState().token`，對 Axios 攔截器極為友善：

```ts
// api.ts
import { useAuthStore } from './stores/authStore';

axios.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### 為什麼版本核對不用 Context

- 版本號只需要在 `Layout` 或 `App` 偵測，跳出全域 Modal 提示
- 沒有第二個組件需要這份資料
- 如果硬塞進 Context，版本號變動時全站組件都會被廣播觸發（即使只是想顯示一個彈窗）

### 組件獨立性原則

> 通用小組件不應依賴全域 Context。

**不推薦**：

```jsx
const Button = () => {
  const locale = useContext(LocaleContext);  // 寫死依賴
  return <button>{locale === 'zh-TW' ? '送出' : 'Submit'}</button>;
};
```

如果把這個 Button 拿到沒有 `LocaleContext.Provider` 的環境，就會壞掉。

**推薦**：

```jsx
const Button = ({ label }) => <button>{label}</button>;
```

讓上層決定要顯示什麼字。這個 Button 才能跨專案複用。

---

## 20. Custom Hook 與 Context 權衡

> 上一章把「版本核對」歸給 Custom Hook，但很多人會誤以為 Hook 就是「另一種 Context」。其實兩者本質完全不同——Hook 是行為複用，Context 是資料共享。搞清楚這個區別是架構決策的最後一塊拼圖。

### 兩者本質不同

| 項目 | Custom Hook | Context |
| --- | --- | --- |
| 本質 | **行為的封裝** | **資料的共享** |
| 比喻 | 隨身工具包 | 廣播電台 |
| 不同地方呼叫 | 各自獨立、互不相通 | 共用同一份資料 |
| 適用 | 邏輯複用（表單驗證、API 呼叫、版本檢查） | 資料共享（Theme、Auth、Language） |

### Custom Hook 的「作用域陷阱」

```jsx
function useCounter() {
  const [count, setCount] = useState(0);
  return [count, setCount];
}

// 在 ComponentA
const [count, setCount] = useCounter();  // count 是 A 的

// 在 ComponentB
const [count, setCount] = useCounter();  // count 是 B 的，與 A 完全獨立！
```

> Custom Hook **不是 Singleton**。每個呼叫端都有自己的一份 state。

### 進階：Hook + Context 組合技

當你既想要邏輯複用，又想要資料共享：

```jsx
// 1. 建立 Context 儲存資料
const VersionContext = createContext(null);

// 2. 建立 Provider
export const VersionProvider = ({ children }) => {
  const [version, setVersion] = useState(null);
  // ... 邏輯
  return <VersionContext.Provider value={version}>{children}</VersionContext.Provider>;
};

// 3. 建立 Custom Hook 包裝 useContext
export const useVersion = () => {
  const ctx = useContext(VersionContext);
  if (!ctx) throw new Error('useVersion must be used within VersionProvider');
  return ctx;
};
```

> 這樣就達成「資料在電台存著，邏輯在工具包裡領取」。

### 邏輯與 UI 的分離：Token 逾期處理

Token 雖然是資料（適合 Context 或 Zustand），但「逾期後跳轉登入」是行為。我們會用 effect 來連結兩者：

```jsx
const { token } = useAuth();

useEffect(() => {
  if (isExpired(token)) {
    navigate('/login');
  }
}, [token]);
```

> Context 提供狀態，useEffect 根據狀態執行動作。

---

# Part 7：邏輯封裝與實戰

> Part 6 講完了「資料怎麼共享」，但實務上還有另一個維度：**業務邏輯怎麼複用**。當多個組件都需要「打 API、表單驗證、權限判斷」時，如果每次都複製貼上，組件會臃腫到難以維護。
>
> 這部分介紹三種封裝層次：Custom Hook 封裝行為（21）、表單管理工具封裝重複的 onChange 樣板（22）、HOC 封裝橫切關注點（23）。

---

## 21. Custom Hook 實戰：封裝 useFetch

> 第 20 章已經講過 Custom Hook 與 Context 的本質差異。這一章從「實際封裝一個 API 工具」入手，展示 Custom Hook 如何把分散在組件裡的 Loading / Error / Data 三態邏輯抽出來。

### Custom Hook 的本質：組合原子 Hook

❌ 錯誤理解：Custom Hook 是某種特殊的 React API
✅ 正確理解：Custom Hook 就是「以 `use` 開頭的普通函式」，把原子 Hook（useState / useEffect / useRef / useContext）組合成具有業務語意的工具

> 它的目的不是取代原生 Hook，而是把它們**組裝成一個業務模組**。基礎語法 → 業務語言。

### 三種職責層次

| 層次 | 包含的原子 Hook | 範例業務 |
| --- | --- | --- |
| 狀態 + 副作用 | useState + useEffect | useFetch、useToggle |
| 跨渲染保留私有資料 | + useRef | useDebounce、useInterval、usePrevious |
| 橋接全域資料 | + useContext / Zustand | useAuthFetch、useCart |

### 實戰：封裝 useFetch

```jsx
import { useState, useEffect } from 'react';

/**
 * @param {Function} apiCall - 回傳 Promise 的 API 函式
 * @param {Array} deps - 依賴改變時重新執行
 */
function useFetch(apiCall, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;  // 呼應第 15 章競態處理
    setLoading(true);

    apiCall()
      .then(res => { if (isMounted) setData(res); })
      .catch(err => { if (isMounted) setError(err); })
      .finally(() => { if (isMounted) setLoading(false); });

    return () => { isMounted = false; };
  }, deps);

  return { data, loading, error };
}
```

### 使用後：組件變得乾淨

```jsx
function CustomerTable() {
  const { data: customers, loading, error } = useFetch(getCustomerList, []);

  if (loading) return <div>載入中...</div>;
  if (error) return <div>錯誤：{error.message}</div>;

  return <ul>{customers.map(c => <li key={c.id}>{c.name}</li>)}</ul>;
}
```

> 這就是第 20 章 MVC 思維中「Hook 是 Controller、Component 是 View」的具體實踐：組件只負責 map 資料與顯示，不關心資料怎麼來。

### 進階：複合式封裝（防抖搜尋）

當業務變複雜，Custom Hook 會同時用到多種原子 Hook：

```jsx
function useSearch(apiFn) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const searchCount = useRef(0);  // 不影響渲染的私有計數

  useEffect(() => {
    if (!term) return;

    const handler = setTimeout(async () => {
      searchCount.current++;
      const data = await apiFn(term);
      setResults(data);
    }, 500);  // 500ms 防抖

    return () => clearTimeout(handler);
  }, [term, apiFn]);

  return { term, setTerm, results, totalSearches: searchCount.current };
}
```

### .NET 對照

| 角色 | .NET MVC | React |
| --- | --- | --- |
| 資料來源 | Controller Action | Custom Hook |
| 狀態旗標 | ViewModel 屬性 | useState |
| 釋放資源 | IDisposable / using | Cleanup function |
| 共用工具 | Service 注入 | Custom Hook 引用 |

### 規則（Rules of Hooks）

- **必須以 `use` 開頭**：React 的 ESLint 規則靠這個前綴檢查
- **不能在迴圈、條件、巢狀函式裡呼叫**：React 靠呼叫順序對應每次渲染的 state
- **只能在 React 組件或其他 Hook 裡呼叫**：不能在普通函式裡用

### 擴展挑戰

如果 API 需要參數（分頁、搜尋關鍵字），useFetch 該怎麼擴展？

- 把參數放進 `deps`，依賴變了自動重抓
- 回傳一個 `refetch` 函式（記得用 `useCallback` 包起來，避免引用不穩定）

---

## 22. 表單處理與驗證：Controlled vs Uncontrolled vs RHF

> useState 是表單入門工具，但 ERP 系統有 50+ 欄位的表單時，每打一個字就重渲染整個表單會卡到無法接受。這一章介紹三種表單方案，幫你在「即時控制」與「效能」之間找平衡。

### 三種表單方案對照

| 方案 | 資料來源 | 何時觸發渲染 | 適用場景 |
| --- | --- | --- | --- |
| 受控組件 | useState | 每次 onChange | 一般表單、需要即時驗證 |
| 非受控組件 | DOM (useRef) | 只有提交時抓值 | 大型表單、效能敏感 |
| React Hook Form | ref-based | 驗證錯誤或提交時 | 業界標準、兼具兩者優點 |

### 受控組件：同步派

每打一個字 → onChange → setState → 重新渲染。

```jsx
const [name, setName] = useState('');
<input value={name} onChange={e => setName(e.target.value)} />
```

✅ 優點：即時攔截（自動轉大寫、限制數字）、即時驗證
❌ 缺點：欄位多時效能差，每次輸入觸發整個組件樹重繪

### 非受控組件：原生派

像批量送出，平常不管，提交時才一次性把值「抓」回來：

```jsx
const inputRef = useRef(null);

const handleSubmit = () => {
  console.log(inputRef.current.value);  // 提交時才抓
};

<input ref={inputRef} />
```

✅ 優點：輸入時不觸發 React 渲染，效能極佳
❌ 缺點：難做即時驗證，思維上較不符 React 資料驅動

### React Hook Form（RHF）：業界標準

底層是非受控（ref）的效能 + 受控的驗證便利：

```jsx
import { useForm } from 'react-hook-form';

function OrderForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    console.log('提交資料:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('customerName', { required: '姓名必填' })} />
      {errors.customerName && <span>{errors.customerName.message}</span>}
      <button type="submit">提交</button>
    </form>
  );
}
```

### 驗證分工：TS vs Zod / Yup

❌ 常見誤解：用 TypeScript 就能驗證使用者輸入
✅ 正確理解：兩者作用時機完全不同

| 工具 | 作用時機 | 能驗證什麼 |
| --- | --- | --- |
| TypeScript | 編譯時（執行後消失） | 物件結構（id 是 number）、初始值型別 |
| Zod / Yup | 執行時 | Pattern、長度、Email 格式、密碼/確認密碼一致 |

> 後端 API 回傳錯誤型別時，TS 攔不住，必須靠 Zod / Yup 在 runtime 把關。

### .NET 對照

| 角色 | .NET MVC | React |
| --- | --- | --- |
| 編譯時型別 | C# 強型別 | TypeScript |
| 模型驗證 | DataAnnotations [Required] | Zod schema / RHF rules |
| 表單樣板 | Razor + ModelBinder | RHF register() |

### 設計建議：抽出共用 Field 組件

當需要「縣市 → 鄉鎮市區」這類連動，封裝成 `<AddressSelector />`：

- **內部內聚**：連動邏輯關在組件內，外部不需要知道實作細節
- **外部解耦**：父層只透過 onChange 接收結果
- **可重用**：訂單、會員、物流共用

> 這就是第 19 章「組件獨立性原則」在表單上的具體實踐——用 props 傳資料、不依賴全域 Context。

### 連動欄位的實作工具

在 RHF 中監聽特定欄位變化用 `watch` 或 `useWatch`：

```jsx
const city = useWatch({ control, name: 'city' });
// city 改變時自動更新可選的鄉鎮市區清單
```

---

## 23. HOC 高階組件：橫切關注點與權限控管

> 第 20 章把 Custom Hook 定位為「行為複用」，但有些行為（權限攔截、Loading 包裝、Error 邊界）必須**包覆整個組件**才能生效。這時候 Custom Hook 不夠，要用 HOC。

### HOC 的定義

> **接收一個組件，回傳一個增強版組件**的函式。

### 實戰：權限門衛 withAdminAuth

```jsx
function withAdminAuth(WrappedComponent) {
  return function (props) {
    const { user } = useAuth();

    if (user.role !== 'admin') {
      return <div>您沒有權限查看此內容</div>;
    }

    return <WrappedComponent {...props} />;
  };
}

const AdminReport = withAdminAuth(SecretReportComponent);
```

### .NET 對照（這是最直覺的類比）

| 概念 | .NET | React HOC |
| --- | --- | --- |
| 權限攔截 | `[Authorize]` Attribute | `withAdminAuth(Component)` |
| 日誌記錄 | Action Filter | `withLogging(Component)` |
| 全域處理 | Middleware | HOC 包覆根組件 |

> HOC 就是 React 版的 **Decorator（裝飾器模式）**，負責處理「橫切關注點（Cross-Cutting Concerns）」——那些散落在多處、但邏輯相同的需求。

### HOC vs Custom Hook 的選擇

| 需求 | 用什麼 | 原因 |
| --- | --- | --- |
| 共享資料/邏輯，但不影響渲染結構 | Custom Hook | 行為複用、組件結構不變 |
| 需要包一層、攔截渲染、加錯誤邊界 | HOC | 控制渲染流程 |
| 需要傳遞 children 並動態決定要不要 render | HOC 或包覆組件 | 等價 |

### 現代趨勢：包覆組件（Wrapper Component）取代 HOC

React 18 後，更常見的寫法是直接寫一個 `<RequireAuth>` 包覆組件，本質跟 HOC 等價，但語法更直觀：

```jsx
function RequireAuth({ children }) {
  const { user } = useAuth();
  if (user.role !== 'admin') return <NoPermission />;
  return children;
}

// 使用
<RequireAuth><AdminReport /></RequireAuth>
```

> HOC 的概念依然重要（理解原理），但實際撰寫時 Wrapper Component + Custom Hook 通常更易讀。

### 水平拆分 vs 垂直拆分

第 22 章的 `<AddressSelector />` 是**水平拆分**（業務組件解耦），這一章的 HOC 是**垂直拆分**（在原組件上疊加邏輯）。兩者都能達到「低耦合、高內聚」，差別在切的方向。

---

# Part 8：路由與全域狀態

> 從「組件 + 邏輯封裝」放大到「整套 SPA 系統」時，會遇到三個工程問題：路徑怎麼管（24）、大型組件怎麼延遲載入（25）、跨頁的資料怎麼共享（26）。

---

## 24. React Router：巢狀路由、Guard、URL 參數

> 在 ERP / CRM 系統中，路由不只是換頁，還承載權限攔截、麵包屑、動態參數。這一章把 React Router 當作前端版的 `RouteConfig.cs` 來理解。

### 巢狀路由（Nested Routes）

後台系統通常有「不變的外框（側邊欄、Header）+ 變動的內容區」。React Router 用 `<Outlet />` 表示子路由要渲染的位置：

```jsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,  // 外框，內含 <Outlet />
    children: [
      { path: 'orders', element: <OrderList /> },
      { path: 'orders/:id', element: <OrderDetail /> },
    ],
  },
]);
```

### 路由守衛（Route Guard）

對應 .NET 的 `[Authorize]`，前端用包覆組件攔截：

```jsx
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // 帶上原本想去的頁面，登入後可以跳回
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// 使用
{
  path: 'admin',
  element: <RequireAuth><AdminPanel /></RequireAuth>,
}
```

### URL 參數三劍客

| Hook | 拿什麼 | URL 範例 |
| --- | --- | --- |
| `useParams` | 路徑參數 | `/product/edit/:id` → `{ id: '5' }` |
| `useSearchParams` | Query String | `?status=active` → `'active'` |
| `useNavigate` | 程式化跳轉 | `navigate('/dashboard')` |

### useNavigate vs `<a href>` vs `window.location`

| 方式 | 重新整理 | 保留 React State | 適用 |
| --- | --- | --- | --- |
| `<a href>` | ✅ 會 | ❌ 失去 | 跳到外站 |
| `<Link to>` | ❌ 不會 | ✅ 保留 | 一般頁內導航（使用者點擊） |
| `useNavigate()` | ❌ 不會 | ✅ 保留 | 邏輯觸發（API 成功後跳轉） |
| `window.location.href` | ✅ 會 | ❌ 失去 | 應避免（會破壞 SPA 體驗） |

```jsx
function OrderCreatePage() {
  const navigate = useNavigate();

  const handleSave = async () => {
    const success = await saveOrderAPI();
    if (success) {
      navigate('/admin/orders');           // 程式化跳轉
    } else {
      navigate('/error', {
        state: { msg: '訂單編號重複' }     // 帶狀態給目標頁
      });
    }
  };

  return <button onClick={handleSave}>儲存</button>;
}
```

### 安全性：對外網站不要用明文自增 ID

❌ 風險寫法：`/product/edit/5`（暴露 ID 結構，方便枚舉攻擊）
✅ 推薦做法：用 UUID（`/product/edit/a1b2-c3d4...`）或 HashID（將數字加密成混淆字串）

> 內部後台用 `?id=5` 沒問題，對外網站要避免讓使用者推測出資源結構。

### useMatches 與麵包屑

`useMatches()` 回傳「從根路由到當前路由匹配到的所有層級」陣列。每個元素包含你在路由表自定義的 `handle` 資訊（如標題）：

```jsx
// 路由設定時定義 handle
{
  path: 'admin',
  handle: { title: '系統管理' },
  children: [
    { path: 'orders', handle: { title: '訂單列表' } },
  ],
}

// 麵包屑組件
function Breadcrumbs() {
  const matches = useMatches();
  const crumbs = matches
    .filter(m => m.handle?.title)
    .map(m => m.handle.title);
  // 在 /admin/orders 時：['系統管理', '訂單列表']

  return <nav>{crumbs.join(' > ')}</nav>;
}
```

> 麵包屑就是從 `useMatches()` 自動生成的「首頁 > 訂單管理 > 編輯訂單」導航，不需要每頁手寫。

### 路由配置必備

- `path: '*'`：放在最後，導向 404 頁面
- 全域 `<ErrorBoundary>` + `<Suspense>` 包覆 Routes（見下一章）
- Code Splitting：用 `React.lazy()` 拆分大型路由（見下一章）

---

## 25. React.lazy 與 Suspense：延遲載入

> 第 17 章講效能優化是「組件層級」的（memo / useMemo / useCallback），這一章是「網路層級」的優化——讓首頁不要一次下載整個 5MB 的 ERP 程式碼。

### React.lazy：拆分代碼

預設打包會把所有組件包成一個巨大的 `main.js`。`React.lazy` 告訴 Vite / Webpack：「這個組件請拆成獨立的 JS 檔，使用者切到對應路由時才下載」。

```jsx
import { lazy, Suspense } from 'react';

const HeavyReport = lazy(() => import('./pages/HeavyReport'));
```

### Suspense：等待過程的 UI

`React.lazy` 是「拆分」，`Suspense` 是「等待時顯示什麼」。兩者是伴生關係：

```jsx
<Suspense fallback={<div>報表加載中...</div>}>
  <HeavyReport />
</Suspense>
```

### 運作原理

1. App 渲染時，React 發現 `HeavyReport` 還沒下載
2. Suspense 捕捉到「尚未就緒」訊號，顯示 fallback
3. 瀏覽器在背景下載 `HeavyReport.js`
4. 下載完成，Suspense 自動換成真正的組件

### 全域骨架建議：Layout 層集中管理

把 Loading 與 Error 拉到最外層，呼應第 19 章「低耦合、高內聚、一次性管理所有相似區塊」的工程目標：

```jsx
<BrowserRouter>
  <ErrorBoundary fallback={<GlobalErrorModal />}>
    <Suspense fallback={<GlobalSpinner />}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* 所有子路由都被 Suspense + ErrorBoundary 保護 */}
        </Route>
      </Routes>
    </Suspense>
  </ErrorBoundary>
</BrowserRouter>
```

### 適用時機

| 適用 | 不適用 |
| --- | --- |
| 路由層級的大型頁面（報表、編輯器） | 首頁立刻會用到的組件 |
| 圖表庫、PDF 預覽器、第三方重型套件 | 純文字、按鈕等小組件 |
| 後台管理系統的不同模組 | 共用 Layout、導覽列 |

### .NET 對照

| 概念 | .NET | React |
| --- | --- | --- |
| 延遲載入程式集 | `Assembly.LoadFile()` | `React.lazy(() => import(...))` |
| 全域例外處理 | Global.asax / Middleware | ErrorBoundary |
| 載入中畫面 | 自己控制 | Suspense fallback |

---

## 26. Zustand 全域狀態管理：對照 .NET DI Lifetimes

> 第 19 章把 Zustand 列為「需要在 React 之外存取（Axios 攔截器）」的全域狀態方案。這一章從 .NET 開發者熟悉的 DI Lifetime 角度，建立完整的選型直覺。

### 為什麼選 Zustand（vs Context / Redux）

| 工具 | 樣板程式碼 | 訂閱粒度 | Provider 包裹 |
| --- | --- | --- | --- |
| Context | 中 | 整個 Provider 重繪 | 必須 |
| Redux Toolkit | 多 | 細（selector） | 必須（Store Provider） |
| Zustand | 極少 | 細（selector） | 不需要 |

### 基本用法

```jsx
import { create } from 'zustand';

const useUserStore = create((set) => ({
  // State
  user: null,
  isAuthenticated: false,

  // Actions（像 Service 層的方法）
  login: async (credentials) => {
    const userData = await loginAPI(credentials);
    set({ user: userData, isAuthenticated: true });
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

### Selector 機制：精準渲染控制

```jsx
function Navbar() {
  // 只訂閱 user 欄位，其他欄位變動不觸發 Navbar 重繪
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);

  return (
    <nav>
      <span>歡迎, {user?.name}</span>
      <button onClick={logout}>登出</button>
    </nav>
  );
}
```

### .NET DI Lifetime 對照（核心對照表）

| 生命週期 | .NET 行為 | React 對應 | 範例 |
| --- | --- | --- | --- |
| Singleton | 整個應用唯一實例 | Zustand / Redux | 登入者資訊、全域主題、權限表 |
| Scoped | 同個 Request 內共用 | Context API（特定層級） | 訂單編輯頁的跨步驟資料 |
| Transient | 每次注入都是新實例 | useState / useRef | 每個 Button 自己的點擊狀態 |

### 為什麼 Zustand 算 Singleton？

```jsx
// stores/userStore.js
const useUserStore = create(...);  // 全 SPA 唯一一份資料
```

無論你在哪個組件呼叫，拿到的都是同一份狀態。狀態住在 JavaScript 的閉包空間，直到網頁重新整理才消失——完全符合 Singleton 定義。

### SA 思考：前端不用擔心 Thread-Safe

❌ 後端 Singleton 的痛點：多執行緒競爭，需要 lock 或雙重檢查鎖定（DCL）
✅ 前端 JavaScript：單執行緒，不會有兩個執行緒同時改 Store

但前端要擔心的是**非同步競爭（Race Condition）**：使用者連點兩次「儲存」，雖然單執行緒但兩個非同步請求可能後發先至。解法是 loading 狀態鎖定按鈕（呼應第 15 章 UI 鎖定策略）。

### 工程化建議

#### 1. 多個小 Store 優於一個大 Store

```text
useUserStore     ← 登入者資訊
useUIStore       ← 側邊欄、主題、Modal 開關
useOrderStore    ← 訂單相關狀態
```

不要把所有東西塞進一個 Store。按業務模組拆分，符合 SOC 原則。

#### 2. 持久化（persist）

內建 middleware，一行同步到 LocalStorage，重新整理後保持登入狀態：

```jsx
import { persist } from 'zustand/middleware';

const useUserStore = create(
  persist(
    (set) => ({ /* ... */ }),
    { name: 'user-storage' }
  )
);
```

#### 3. 跨 React 環境存取（Token 經典場景）

```ts
// api.ts（純 JS 檔，不是 React 組件）
import { useUserStore } from './stores/userStore';

axios.interceptors.request.use(config => {
  const token = useUserStore.getState().token;  // 不需要 Hook 也能拿
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

> 這就是第 19 章「Token 不放 Context、要放 Zustand」的具體原因——Axios 攔截器不是 React 組件，不能用 useContext。

---

# Part 9：品質保證與部署

> 寫得出功能不等於寫得出可上線的系統。這部分介紹三個面向：用 DevTools 找出效能瓶頸（27）、用 Vite 處理環境差異（28）、把整套 MVC 思維落地到 React 架構決策（29）。
>
> 測試工具 Vitest 與 Playwright 因份量較大，獨立成 [Vitest 自動化測試學習筆記](vitest-自動化測試學習筆記.md)，這裡不重複。

---

## 27. React DevTools 與效能診斷

> 第 17 章學會了三大優化工具，但「該優化哪個組件」需要量測證據。React DevTools 就是 React 專用的 X 光機。

### 安裝與位置

React DevTools 是 Meta 官方提供的瀏覽器擴充功能（Chrome / Edge / Firefox）。安裝後 F12 會多出兩個頁籤：

- **⚛️ Components**：組件樹檢視（看 React 元件層級，而非 `<div>`）
- **⚛️ Profiler**：效能錄製（火焰圖）

### Components 頁籤能做的事

- 點擊組件，直接看當前的 Props 與 State
- 查 Hooks（顯示組件用了哪些 useState、useContext 並顯示其值）
- 跳轉到對應 Source

### Profiler 頁籤的關鍵圖表

| 圖表 | 用途 |
| --- | --- |
| Flamegraph（火焰圖） | 看哪個組件渲染時間最長、寬度＝耗時 |
| Ranked Chart | 直接列出本次 commit 渲染最久的前幾名 |
| Commits | 看一段操作期間有幾次 commit、每次有什麼變動 |

### 排查的標準三問

1. 是因為**資料量太大**？→ 考慮虛擬列表、分頁
2. 是因為**父組件頻繁更新**導致子組件無謂重繪？→ 套用第 17 章 memo / useCallback
3. 是因為 **Context value 每次都是新物件**？→ 包 useMemo（呼應第 18 章效能陷阱）

### 安全性：對外發布會自動關閉 DevTools 能力

❌ 常見擔心：別人裝 DevTools 就能看到我整個應用的內部資料？
✅ 正解：React 在 production 模式會自動限制

| 模式 | DevTools 行為 |
| --- | --- |
| Development（`npm run dev`） | Props / State 完整顯示，Profiler 可用 |
| Production（`npm run build`） | 變數名被混淆（`userName` → `a`），Profiler 停用 |

### 真正的安全防線

> 前端代碼能被看到是常態，不應依賴「藏起來」做安全。
> 真正的防線是：**後端 API 的 Token 驗證 + 不該回傳的敏感欄位不回傳**。

只要 API 有做好權限驗證，前端被看到組件結構並不會導致資料外洩。

### 補充：第三方 Devtools

某些套件會提供自己的 Devtools（畫面右下角會出現浮動圖示），例如：

- **TanStack Query Devtools**：顯示所有 query 的快取狀態、stale 時間
- **Zustand Devtools**：搭配 Redux DevTools Extension 觀察 store 變化

> 這就是你提到的「Vue 那種右下浮動圖案」對應的 React 生態。它們只在 development 模式啟用。

---

## 28. Vite 建置工具與環境配置

> 第 25 章學會了 React.lazy 拆分代碼，但拆分由誰執行？答案是 Vite。這一章講 Vite 在開發 / 部署時的三個關鍵能力。

### 環境變數管理（.env）

區分 development / staging / production 的設定：

```
.env.development   → npm run dev 時載入
.env.staging       → 測試環境
.env.production    → npm run build 時載入
```

```env
# .env.development
VITE_API_BASE=http://localhost:3000/api

# .env.production
VITE_API_BASE=https://api.example.com
```

> Vite 的環境變數**必須以 `VITE_` 為前綴**才會被打包進前端代碼。沒前綴的變數只能在 `vite.config.ts` 等 Node 端使用，避免不小心把後端密鑰塞進前端。

### Proxy 設定：解決開發時的 CORS

開發時前端跑在 `localhost:5173`，後端跑在 `localhost:3000`，瀏覽器會擋 CORS。Vite Proxy 讓你的前端請求 `/api` 時，由 Vite 幫你轉發到後端：

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

> 等同於 .NET 開發時用 IIS Express 把前後端代理到同一個 Origin。

### 開發模式 vs 生產模式的物理差異

| 項目 | Development | Production |
| --- | --- | --- |
| 變數名 | `fetchCustomerData` | `a`（混淆 / Uglification） |
| 註解與空白 | 保留 | 全部移除（Minification） |
| 警告訊息 | 完整顯示 | 從打包檔砍掉 |
| Console.log | 保留 | 通常移除（看設定） |
| 測試代碼 | 不影響（開發跑） | 完全不會被打包（Tree Shaking） |
| Source Map | 完整 | 通常關閉或單獨上傳到 Sentry |

底層機制：React 源碼充滿條件編譯：

```js
if (process.env.NODE_ENV !== 'production') {
  // 警告、DevTools 對接、效能監控
}
```

打包時 `process.env.NODE_ENV` 被替換成字串常數，整個 if 區塊被視為 Dead Code 移除。

### 部署搭配（你的 IIS + PM2 場景）

如果用 Standalone 包搭配 IIS + PM2 反向代理：

1. `npm run build` 產出 `.next`（Next.js）或 `dist`（純 Vite）資源
2. PM2 啟動 Node 程式（Next.js 的 `node server.js`）
3. IIS 反向代理把 `/` 轉發到 PM2 監聽的 port
4. **Vitest、開發依賴、測試檔案完全不會出現在最終產物中**——因為它們在 `devDependencies` 且從未被 `import` 進產品代碼

---

## 29. MVC 在 React 中的最終實踐

> 整份筆記從「資料驅動」（第 1 章）到「架構決策」（第 19 章）一路鋪墊到這裡。這最後一章把所有工具串成一張地圖，讓你用 .NET MVC 的分層思維駕馭 React 專案。

### 完整對照表

| MVC 角色 | .NET 實作 | React 實作 | 職責 |
| --- | --- | --- | --- |
| Model（資料） | C# 類別 + EF Entity | TypeScript Schema + Zustand Store + API Service | 定義資料長相、儲存當前狀態、與後端通訊 |
| View（畫面） | Razor View | React Component + TailwindCSS | 排版、顯示資料、接收使用者輸入 |
| Controller（邏輯） | C# Controller | Custom Hook | 調度資料、處理錯誤、決定何時更新 Model |

### 常見誤解：Model 只是型別定義？

❌ 錯誤理解：在 React 裡 Model 只是 `interface User { ... }`
✅ 正確理解：Model 是「資料 + 行為」的合稱

在 React 中的「廣義 Model」包含：

1. **Schema 定義**：TypeScript Interface / Type（定義 API 回傳長相）
2. **狀態持久化**：Zustand Store（記憶體裡的當前資料）
3. **資料獲取**：API Service + Custom Hook（向後端拿資料）

> 這呼應物件導向中 Model 的定義：**封裝資料與相關業務邏輯**。Zustand 不只存 `userName`（資料），還包含 `login()`、`logout()`（行為），完美符合 Model 的本質。

### Custom Hook 為什麼算 Controller？

useState / Zustand 是「存錢筒」，Custom Hook 是「提款機」。提款機會用到：

- `useEffect`：決定何時去後端領錢（fetch）
- `useMemo` / `useCallback`：優化計算過程
- `useRef`：處理不需要渲染的後台操作
- `Zustand`：把領到的錢存進全域金庫

當把這些原子 Hook 封裝進 `useOrderManagement()`，這個 Hook 就變成「專門管理訂單邏輯的 Controller」。

### 三層分工的具體範例

```typescript
// Model：型別定義（src/types/domain.ts）
interface Order {
  id: string;
  customerId: string;
  amount: number;
}

// Model：全域狀態（stores/orderStore.ts）
const useOrderStore = create((set) => ({
  orders: [] as Order[],
  setOrders: (orders) => set({ orders }),
}));

// Controller：業務邏輯（hooks/useOrderList.ts）
function useOrderList() {
  const { orders, setOrders } = useOrderStore();
  const { data, loading, error } = useFetch(getOrderListAPI);

  useEffect(() => {
    if (data) setOrders(data);
  }, [data]);

  return { orders, loading, error };
}

// View：純呈現（components/OrderTable.tsx）
function OrderTable() {
  const { orders, loading, error } = useOrderList();

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  return <Table data={orders} />;
}
```

組件本身不包含業務判斷，只是「呼叫 Hook + 渲染樣式」的膠水層。這正是 SOC（Separation of Concerns，關注點分離）的最終實踐。

### 結論：從 Frontend Engineer 到 SA

當你能用以下視角看 React 專案，你就完成了從「寫 UI 的人」到「設計系統的人」的進化：

- **資料的生存空間**：哪些放 Singleton、哪些放 Scoped、哪些放 Transient（第 19、26 章）
- **資料的傳遞路徑**：誰提供、誰消費、誰要避開（第 18、20 章）
- **行為的封裝層次**：原子 Hook → Custom Hook → HOC（第 21、23 章）
- **品質的自動化防線**：Vitest 測邏輯、Playwright 測流程、DevTools 找瓶頸（第 27 章 + Vitest 獨立筆記）
- **環境的物理隔離**：development 與 production 是兩種不同人格（第 28 章）

---

# 結語

## 兩年經驗開發者的核心心法

### 1. 先寫，後優化

不要預先加 `React.memo`、`useMemo`、`useCallback`。先讓功能跑起來，遇到效能問題再用 React DevTools 定位瓶頸。

### 2. 區分「衍生資料」與「外部副作用」

- 從現有 state/props 算出來的值 → `useMemo` 或直接寫
- 跟 React 之外互動 → `useEffect`

### 3. 思考資料的「受災範圍」

每次設計全域狀態時，問自己：「資料變動時，會有哪些組件受影響？」如果只有 1-2 個組件，根本不需要 Context；如果整個應用都受影響，再考慮 Provider。

### 4. 永遠想著「我是不是在跟 JavaScript 對著幹」

- 物件比較是位址比較 → 不可變更新
- setState 是非同步預約 → 不要立刻讀新值
- effect 是事後執行 → 不要期待它「同步」

### 5. 命名與獨立性

通用組件不要寫死全域依賴。靠 props 傳資料的元件，才能跨專案、跨情境複用。

---

## 知識體系總覽

```text
React 進階知識
├── Part 1：核心哲學
│   ├── 資料驅動（UI = f(state)）
│   ├── 單向資料流
│   └── Virtual DOM
├── Part 2：JavaScript 記憶體模型
│   ├── 嚴格相等（基礎）
│   ├── 不可變性（React 應用）
│   └── 深淺拷貝（實作細節）
├── Part 3：State 與渲染時序
│   ├── useState 快照與批次
│   ├── Render Pipeline（Render → Commit → Passive）
│   └── Class 生命週期（歷史脈絡）
├── Part 4：useEffect 與副作用
│   ├── 三大模式
│   ├── 死循環陷阱
│   ├── Cleanup 清理機制
│   ├── 事件監聽器（Cleanup 應用）
│   └── 競態處理（Cleanup 應用）
├── Part 5：衍生資料與效能優化
│   ├── useMemo vs useEffect 的選用
│   └── React.memo / useMemo / useCallback
├── Part 6：架構決策
│   ├── Prop Drilling 與 Context
│   ├── Context vs Zustand vs Custom Hook
│   └── 組件獨立性
├── Part 7：邏輯封裝與實戰
│   ├── Custom Hook 實戰（useFetch / useSearch）
│   ├── 表單處理（Controlled / Uncontrolled / RHF）
│   └── HOC 與權限控管
├── Part 8：路由與全域狀態
│   ├── React Router（Nested / Guard / Params）
│   ├── React.lazy + Suspense
│   └── Zustand（對照 .NET DI Lifetimes）
└── Part 9：品質保證與部署
    ├── React DevTools 與效能診斷
    ├── Vite 環境配置與打包機制
    └── MVC 在 React 中的最終實踐
```

> 工程化兩個專題獨立成檔：
> - [TailwindCSS 進階學習筆記](tailwindcss-進階學習筆記.md)（搭配第 22、29 章 View 層）
> - [Vitest 自動化測試學習筆記](vitest-自動化測試學習筆記.md)（搭配 Part 9 品質保證）

---

## 延伸學習主題

以下主題尚未涵蓋，建議後續深入：

- **React Server Components**（Next.js App Router）
- **Concurrent Features**：useTransition、useDeferredValue
- **TanStack Query**：取代手動 useEffect + useState 處理伺服器狀態（取代第 21 章 useFetch 的進階方案）
- **TypeScript 在 React 中的進階用法**：泛型組件、Discriminated Union props
- **i18n 國際化**：react-i18next 或 next-intl
- **Storybook**：組件文件化與獨立測試環境
- **Sentry / LogRocket**：生產環境錯誤追蹤
- **Playwright 進階**：視覺迴歸測試（Visual Regression）

> 已涵蓋於本筆記或獨立檔案：
> - Custom Hook 實戰 → 第 21 章
> - Suspense → 第 25 章
> - Zustand 實戰 → 第 26 章
> - 測試（Vitest + Playwright）→ [Vitest 自動化測試學習筆記](vitest-自動化測試學習筆記.md)
> - TailwindCSS → [TailwindCSS 進階學習筆記](tailwindcss-進階學習筆記.md)

---

> 本文件基於學習對話整理，可作為 React 進階開發的查閱手冊與面試準備。
