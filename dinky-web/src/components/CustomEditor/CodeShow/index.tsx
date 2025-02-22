/*
 *
 *  Licensed to the Apache Software Foundation (ASF) under one or more
 *  contributor license agreements.  See the NOTICE file distributed with
 *  this work for additional information regarding copyright ownership.
 *  The ASF licenses this file to You under the Apache License, Version 2.0
 *  (the "License"); you may not use this file except in compliance with
 *  the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

import EditorFloatBtn from '@/components/CustomEditor/EditorFloatBtn';
import { LogLanguage } from '@/components/CustomEditor/languages/javalog';
import useThemeValue from '@/hooks/useThemeValue';
import { MonacoEditorOptions } from '@/types/Public/data';
import { convertCodeEditTheme } from '@/utils/function';
import { Editor, useMonaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { EditorLanguage } from 'monaco-editor/esm/metadata';
import { useEffect, useState } from 'react';
import FullscreenBtn from '../FullscreenBtn';

// loader.config({monaco});
/**
 * props
 * todo:
 *  1. Realize full screen/exit full screen in the upper right corner of the editor (Visible after opening)
 *    - The full screen button is done, but the full screen is not implemented
 *  2. Callback for right-clicking to clear logs (optional, not required)
 */
export type CodeShowFormProps = {
  height?: string | number;
  width?: string;
  language?: EditorLanguage | string;
  options?: any;
  code: string;
  lineNumbers?: string;
  autoWrap?: string;
  showFloatButton?: boolean;
  refreshLogCallback?: () => void;
  fullScreenBtn?: boolean;
  style?: React.CSSProperties;
};

const CodeShow = (props: CodeShowFormProps) => {
  /**
   * 1. height: edit height
   * 2. width: edit width
   * 3. language: edit language
   * 4. options: edit options
   * 5. code: content
   * 6. readOnly: is readOnly, value: true | false
   * 7. lineNumbers: is show lineNumbers, value: on | off | relative | interval
   * 8. theme: edit theme , value: vs-dark | vs | hc-black
   * 9. autoWrap: is auto wrap, value: on | off | wordWrapColumn | bounded
   */
  const {
    height = '30vh', // if null or undefined, set default value
    width = '100%', // if null or undefined, set default value
    language,
    options = {
      ...MonacoEditorOptions // set default options
    },
    code, // content
    lineNumbers, // show lineNumbers
    autoWrap = 'on', //  auto wrap
    showFloatButton = false,
    refreshLogCallback,
    fullScreenBtn = false
  } = props;

  const { ScrollType } = editor;

  const [scrollBeyondLastLine] = useState<boolean>(options.scrollBeyondLastLine);

  const [loading, setLoading] = useState<boolean>(false);
  const [stopping, setStopping] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [fullScreen, setFullScreen] = useState<boolean>(false);
  const [editorRef, setEditorRef] = useState<any>();
  const [timer, setTimer] = useState<NodeJS.Timer>();
  const themeValue = useThemeValue();

  // 使用编辑器钩子, 拿到编辑器实例
  const monaco = useMonaco();

  useEffect(() => {
    convertCodeEditTheme(monaco?.editor);
    // 需要调用 手动注册下自定义语言
    LogLanguage(monaco);
  }, [monaco]);

  /**
   *  handle sync log
   * @returns {Promise<void>}
   */
  const handleSyncLog = async () => {
    setLoading(true);
    setInterval(() => {
      refreshLogCallback?.();
      setLoading(false);
    }, 1000);
  };

  /**
   *  handle stop auto refresh log
   */
  const handleStopAutoRefresh = () => {
    setStopping(true);
    setInterval(() => {
      clearInterval(timer);
      setStopping(false);
      setAutoRefresh(false);
    }, 1000);
  };

  /**
   *  handle stop auto refresh log
   */
  const handleStartAutoRefresh = async () => {
    setAutoRefresh(true);
    const timerSync = setInterval(() => {
      handleSyncLog();
    }, 5000);
    setTimer(timerSync);
  };

  /**
   *  handle scroll to top
   */
  const handleBackTop = () => {
    editorRef.revealLine(1);
  };

  /**
   *  handle scroll to bottom
   */
  const handleBackBottom = () => {
    editorRef.revealLine(editorRef.getModel().getLineCount());
  };

  /**
   *  handle scroll to down
   */
  const handleDownScroll = () => {
    editorRef.setScrollPosition({ scrollTop: editorRef.getScrollTop() + 500 }, ScrollType.Smooth);
  };

  /**
   *  handle scroll to up
   */
  const handleUpScroll = () => {
    editorRef?.setScrollPosition({ scrollTop: editorRef.getScrollTop() - 500 }, ScrollType.Smooth);
  };

  /**
   *  editorDidMount
   * @param {editor.IStandaloneCodeEditor} editor
   */
  const editorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    setEditorRef(editor);
    editor.layout();
    editor.focus();
    if (scrollBeyondLastLine) {
      editor.onDidChangeModelContent(() => {
        const lineCount = editor.getModel()?.getLineCount() as number;
        if (lineCount > 20) {
          editor.revealLine(lineCount);
        } else {
          editor.revealLine(1);
        }
      });
    }
  };

  const restEditBtnProps = {
    refreshLogCallback,
    autoRefresh,
    stopping,
    loading,
    handleSyncLog,
    handleStopAutoRefresh,
    handleStartAutoRefresh,
    handleBackTop,
    handleBackBottom,
    handleUpScroll,
    handleDownScroll
  };

  /**
   *  render
   */
  return (
    <div className={'monaco-float'} style={props.style}>
      {/* fullScreen button */}
      {fullScreenBtn && (
        <FullscreenBtn
          isFullscreen={fullScreen}
          fullScreenCallBack={() => setFullScreen(!fullScreen)}
        />
      )}

      {/* editor */}
      <Editor
        width={width}
        height={height}
        value={loading ? 'loading...' : code}
        language={language}
        options={{
          ...options,
          scrollBeyondLastLine: false,
          readOnly: true,
          wordWrap: autoWrap,
          autoDetectHighContrast: true,
          selectOnLineNumbers: true,
          fixedOverflowWidgets: true,
          autoClosingDelete: 'always',
          lineNumbers,
          minimap: { enabled: false },
          scrollbar: {
            // Subtle shadows to the left & top. Defaults to true.
            useShadows: false,

            // Render vertical arrows. Defaults to false.
            // verticalHasArrows: true,
            // Render horizontal arrows. Defaults to false.
            // horizontalHasArrows: true,

            // Render vertical scrollbar.
            // Accepted values: 'auto', 'visible', 'hidden'.
            // Defaults to 'auto'
            vertical: 'visible',
            // Render horizontal scrollbar.
            // Accepted values: 'auto', 'visible', 'hidden'.
            // Defaults to 'auto'
            horizontal: 'visible',
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            arrowSize: 30
          }
        }}
        onMount={editorDidMount}
        theme={convertCodeEditTheme()}
      />

      {/* float button */}
      {showFloatButton && (
        <div
          style={{
            width: 35,
            height: height,
            backgroundColor: themeValue.borderColor,
            paddingBlock: 10
          }}
        >
          <EditorFloatBtn {...restEditBtnProps} />
        </div>
      )}
    </div>
  );
};

export default CodeShow;
