// Default email template design with placeholders for Unlayer editor
export const defaultTemplateDesign = {
  "body": {
    "rows": [
      {
        "cells": [1],
        "columns": [
          {
            "contents": [
              {
                "type": "html",
                "values": {
                  "html": "{{HEADER}}",
                  "hideDesktop": false,
                  "_meta": {
                    "htmlID": "u_content_html_1",
                    "htmlClassNames": "u_content_html"
                  }
                }
              }
            ],
            "values": {
              "backgroundColor": "",
              "padding": "0px",
              "_meta": {
                "htmlID": "u_column_1",
                "htmlClassNames": "u_column"
              }
            }
          }
        ],
        "values": {
          "displayCondition": null,
          "columns": false,
          "backgroundColor": "#ffffff",
          "columnsBackgroundColor": "",
          "backgroundImage": {
            "url": "",
            "fullWidth": true,
            "repeat": false,
            "center": true,
            "cover": false
          },
          "padding": "0px",
          "hideDesktop": false,
          "_meta": {
            "htmlID": "u_row_1",
            "htmlClassNames": "u_row"
          },
          "selectable": true,
          "draggable": true,
          "duplicatable": true,
          "deletable": true,
          "hideable": true
        }
      },
      {
        "cells": [1],
        "columns": [
          {
            "contents": [
              {
                "type": "html",
                "values": {
                  "html": "{{CONTENT}}",
                  "hideDesktop": false,
                  "_meta": {
                    "htmlID": "u_content_html_2",
                    "htmlClassNames": "u_content_html"
                  }
                }
              }
            ],
            "values": {
              "backgroundColor": "",
              "padding": "20px",
              "_meta": {
                "htmlID": "u_column_2",
                "htmlClassNames": "u_column"
              }
            }
          }
        ],
        "values": {
          "displayCondition": null,
          "columns": false,
          "backgroundColor": "#ffffff",
          "columnsBackgroundColor": "",
          "backgroundImage": {
            "url": "",
            "fullWidth": true,
            "repeat": false,
            "center": true,
            "cover": false
          },
          "padding": "0px",
          "hideDesktop": false,
          "_meta": {
            "htmlID": "u_row_2",
            "htmlClassNames": "u_row"
          },
          "selectable": true,
          "draggable": true,
          "duplicatable": true,
          "deletable": true,
          "hideable": true
        }
      },
      {
        "cells": [1],
        "columns": [
          {
            "contents": [
              {
                "type": "html",
                "values": {
                  "html": "{{FOOTER}}",
                  "hideDesktop": false,
                  "_meta": {
                    "htmlID": "u_content_html_3",
                    "htmlClassNames": "u_content_html"
                  }
                }
              }
            ],
            "values": {
              "backgroundColor": "",
              "padding": "0px",
              "_meta": {
                "htmlID": "u_column_3",
                "htmlClassNames": "u_column"
              }
            }
          }
        ],
        "values": {
          "displayCondition": null,
          "columns": false,
          "backgroundColor": "#f8f9fa",
          "columnsBackgroundColor": "",
          "backgroundImage": {
            "url": "",
            "fullWidth": true,
            "repeat": false,
            "center": true,
            "cover": false
          },
          "padding": "0px",
          "hideDesktop": false,
          "_meta": {
            "htmlID": "u_row_3",
            "htmlClassNames": "u_row"
          },
          "selectable": true,
          "draggable": true,
          "duplicatable": true,
          "deletable": true,
          "hideable": true
        }
      },
      {
        "cells": [1],
        "columns": [
          {
            "contents": [
              {
                "type": "html",
                "values": {
                  "html": "<div style=\"text-align: center; padding: 10px; font-size: 11px; color: #666666;\"><a href=\"{{UNSUBSCRIBE_LINK}}\" style=\"color: #666666; text-decoration: underline;\">Unsubscribe</a></div>",
                  "hideDesktop": false,
                  "_meta": {
                    "htmlID": "u_content_html_4",
                    "htmlClassNames": "u_content_html"
                  }
                }
              }
            ],
            "values": {
              "backgroundColor": "",
              "padding": "10px",
              "_meta": {
                "htmlID": "u_column_4",
                "htmlClassNames": "u_column"
              }
            }
          }
        ],
        "values": {
          "displayCondition": null,
          "columns": false,
          "backgroundColor": "#f8f9fa",
          "columnsBackgroundColor": "",
          "backgroundImage": {
            "url": "",
            "fullWidth": true,
            "repeat": false,
            "center": true,
            "cover": false
          },
          "padding": "0px",
          "hideDesktop": false,
          "_meta": {
            "htmlID": "u_row_4",
            "htmlClassNames": "u_row"
          },
          "selectable": true,
          "draggable": true,
          "duplicatable": true,
          "deletable": true,
          "hideable": true
        }
      }
    ],
    "values": {
      "popupPosition": "center",
      "popupWidth": "600px",
      "popupHeight": "auto",
      "borderRadius": "0px",
      "contentAlign": "center",
      "contentVerticalAlign": "center",
      "contentWidth": "600px",
      "fontFamily": {
        "label": "Arial",
        "value": "arial,helvetica,sans-serif"
      },
      "textColor": "#000000",
      "popupBackgroundColor": "#FFFFFF",
      "popupBackgroundImage": {
        "url": "",
        "fullWidth": true,
        "repeat": false,
        "center": true,
        "cover": true
      },
      "popupOverlay_backgroundColor": "rgba(0, 0, 0, 0.1)",
      "popupCloseButton_position": "top-right",
      "popupCloseButton_backgroundColor": "#DDDDDD",
      "popupCloseButton_iconColor": "#000000",
      "popupCloseButton_borderRadius": "0px",
      "popupCloseButton_margin": "0px",
      "popupCloseButton_action": {
        "name": "close_popup",
        "attrs": {
          "onClick": "document.querySelector('.u-popup-container').style.display = 'none';"
        }
      },
      "backgroundColor": "#f9f9f9",
      "backgroundImage": {
        "url": "",
        "fullWidth": true,
        "repeat": false,
        "center": true,
        "cover": false
      },
      "preheaderText": "",
      "linkStyle": {
        "body": true,
        "linkColor": "#0000ee",
        "linkHoverColor": "#0000ee",
        "linkUnderline": true,
        "linkHoverUnderline": true
      },
      "_meta": {
        "htmlID": "u_body",
        "htmlClassNames": "u_body"
      }
    }
  },
  "schemaVersion": 8
};
