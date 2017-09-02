import React from 'react';

const HL = ({ children }) => <span className="help__highlight">{children}</span>;

const Help = () => (
  <div className="help">
    <div className="help__header">
      <HL>DAS-UI</HL> is domain-agnostic keyboard-based visual programming language with JavaScript backend.
      <p>
        Blinking rectangle is the cursor, you can move it using <HL>hjkl</HL>:
      </p>
      <ul className="help__list">
        <li>
          <HL>h</HL>: left
        </li>
        <li>
          <HL>j</HL>: down
        </li>
        <li>
          <HL>k</HL>: up
        </li>
        <li>
          <HL>l</HL>: right
        </li>
      </ul>
      <p>
        To create a block hit <HL>n</HL>, a prompt will appear with option to select one of existing blocks, or make new
        one.
      </p>
      <p>
        When creating new block editor window will appear. Most of <HL>vim</HL> shortcuts will work.{' '}
      </p>
      <p>
        To save and quit type <HL>:w</HL> (first <HL>:</HL> will open prompt at the bottom, then type <HL>w</HL> and hit{' '}
        <HL>Enter</HL>), to quit without saving type <HL>:q</HL>.
      </p>
      <p>
        New blocks created by you can also be edited after they are placed on board: move cursor behind block contents
        and hit <HL>e</HL>.
      </p>
      <p>
        To connect blocks first move the cursor behind input or output (red frame will appear), and hit <HL>c</HL>.
        Letters will appear next to possible connection, hit that letter (or type letter combination if longer than
        single letter) and connection will be made. If you are overwriting existing connection, old one will disappear.
      </p>
      <p>
        To remove connection, move the cursor behind input or output, and hit <HL>d</HL>.
      </p>
      <p>
        To remove block, move the cursor behind block content, and hit <HL>d</HL>.
      </p>
      <p>
        To jump quickly to block, hit <HL>f</HL>, and type letter (or combination of letters) near desired block.
      </p>
      <p>
        Blocks can be moved with <HL>shift + hjkl</HL> combination: first move cursor behind block content (red frame
        will appear), hold <HL>shift</HL> and type one of <HL>hjkl</HL> to move block.
      </p>
      <p>Blocks can also be resized:</p>
      <ul className="help__list">
        <li>
          <HL>{'>'}</HL>: wider
        </li>
        <li>
          <HL>{'<'}</HL>: thinner
        </li>
        <li>
          <HL>+</HL>: taller
        </li>
        <li>
          <HL>-</HL>: shorter
        </li>
      </ul>
      <p>
        To save the graph and blocks hit <HL>s</HL>. URL can be then copied and saved for later.
      </p>
      <p>
        To toggle help hit <HL>?</HL>.
      </p>
      <HL>DAS-UI</HL> was created by <a className="help__link" href="http://szymonkaliski.com">Szymon Kaliski</a>.
    </div>
  </div>
);

export default Help;
