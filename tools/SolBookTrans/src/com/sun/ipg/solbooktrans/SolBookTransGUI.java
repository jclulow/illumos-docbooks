/*
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS HEADER.
 *
 * Copyright 1997-2007 Sun Microsystems, Inc. All rights reserved.
 *
 * The contents of this file are subject to the terms of either the GNU
 * General Public License Version 2 only ("GPL") or the Common
 * Development and Distribution License("CDDL") (collectively, the
 * "License"). You may not use this file except in compliance with the
 * License. You can obtain a copy of the License at
 * http://www.netbeans.org/cddl-gplv2.html
 * or nbbuild/licenses/CDDL-GPL-2-CP. See the License for the
 * specific language governing permissions and limitations under the
 * License.  When distributing the software, include this License Header
 * Notice in each file and include the License file at
 * nbbuild/licenses/CDDL-GPL-2-CP.  Sun designates this
 * particular file as subject to the "Classpath" exception as provided
 * by Sun in the GPL Version 2 section of the License file that
 * accompanied this code. If applicable, add the following below the
 * License Header, with the fields enclosed by brackets [] replaced by
 * your own identifying information:
 * "Portions Copyrighted [year] [name of copyright owner]"
 *
 * Contributor(s):
 *
 * If you wish your version of this file to be governed by only the CDDL
 * or only the GPL Version 2, indicate your decision by adding
 * "[Contributor] elects to include this software in this distribution
 * under the [CDDL or GPL Version 2] license." If you do not indicate a
 * single choice of license, a recipient has the option to distribute
 * your version of this file under either the CDDL, the GPL Version 2 or
 * to extend the choice of license to its licensees as provided above.
 * However, if you add GPL Version 2 code and therefore, elected the GPL
 * Version 2 license, then the option applies only if the new code is
 * made subject to such option by the copyright holder.
 */

package com.sun.ipg.solbooktrans;

import javax.swing.*;
import java.io.*;


/**
 * A single screen GUI for collecting the needed parameters for running SolBook transformations.
 * Gets the needed info from user and then instantates and runs a SolBookTransformer instance to perform the transform.
 * Shows output from SolBookTransformer in feedback text area at bottom of GUI.
 * @author  Mark Brundege
 */
public class SolBookTransGUI extends javax.swing.JFrame implements ProcessLogger {
    
    private File srcFile;
    private File outputDir;
    private String transformType;
    private String langCode;
    private String pageBreakPoint;
    
    private String logBuffer;
    
    
    /** Creates new form SolBookTransGUI */
    public SolBookTransGUI() {
        initComponents();
    }
    
  
    
    
    /** This method is called from within the constructor to
     * initialize the form.
     * WARNING: Do NOT modify this code. The content of this method is
     * always regenerated by the Form Editor.
     */
    // <editor-fold defaultstate="collapsed" desc="Generated Code">//GEN-BEGIN:initComponents
    private void initComponents() {

        jLabel1 = new javax.swing.JLabel();
        jLabel2 = new javax.swing.JLabel();
        srcPathField = new javax.swing.JTextField();
        srcBrowseButton = new javax.swing.JButton();
        jLabel3 = new javax.swing.JLabel();
        outputDirField = new javax.swing.JTextField();
        outputBrowseButton = new javax.swing.JButton();
        jLabel4 = new javax.swing.JLabel();
        transformTypeBox = new javax.swing.JComboBox();
        beginTransformButton = new javax.swing.JButton();
        jScrollPane1 = new javax.swing.JScrollPane();
        feedbackField = new javax.swing.JTextArea();
        jLabel5 = new javax.swing.JLabel();
        langSelectBox = new javax.swing.JComboBox();

        setDefaultCloseOperation(javax.swing.WindowConstants.EXIT_ON_CLOSE);
        setTitle("SolBookTrans");

        jLabel1.setFont(new java.awt.Font("Tahoma", 1, 14));
        jLabel1.setText("SolBookTrans: For transforming SolBook 3.5 XML into HTML or DocBook XML");

        jLabel2.setText("1. Select the SolBook XML source file.");

        srcPathField.setEditable(false);

        srcBrowseButton.setText("Browse");
        srcBrowseButton.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                srcBrowseButtonActionPerformed(evt);
            }
        });

        jLabel3.setText("2. Select the directory where you want to output the transformed files.");

        outputDirField.setEditable(false);

        outputBrowseButton.setText("Browse");
        outputBrowseButton.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                outputBrowseButtonActionPerformed(evt);
            }
        });

        jLabel4.setText("3. Select the type of transformation to perform.");

        transformTypeBox.setModel(new DefaultComboBoxModel(SolBookTransTypeFactory.TRANSFORM_NAMES));
        transformTypeBox.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                transformTypeBoxActionPerformed(evt);
            }
        });

        beginTransformButton.setText("Begin the Transformation");
        beginTransformButton.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                beginTransformButtonActionPerformed(evt);
            }
        });

        feedbackField.setColumns(20);
        feedbackField.setRows(5);
        jScrollPane1.setViewportView(feedbackField);

        jLabel5.setText("4. Select the language.");

        langSelectBox.setModel(new javax.swing.DefaultComboBoxModel(new String[] { "en" }));
        langSelectBox.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                langSelectBoxActionPerformed(evt);
            }
        });

        org.jdesktop.layout.GroupLayout layout = new org.jdesktop.layout.GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(org.jdesktop.layout.GroupLayout.LEADING)
            .add(org.jdesktop.layout.GroupLayout.TRAILING, layout.createSequentialGroup()
                .add(layout.createParallelGroup(org.jdesktop.layout.GroupLayout.TRAILING)
                    .add(org.jdesktop.layout.GroupLayout.LEADING, layout.createSequentialGroup()
                        .addContainerGap()
                        .add(jScrollPane1, org.jdesktop.layout.GroupLayout.DEFAULT_SIZE, 580, Short.MAX_VALUE))
                    .add(org.jdesktop.layout.GroupLayout.LEADING, layout.createSequentialGroup()
                        .add(20, 20, 20)
                        .add(transformTypeBox, 0, 570, Short.MAX_VALUE))
                    .add(org.jdesktop.layout.GroupLayout.LEADING, layout.createSequentialGroup()
                        .addContainerGap()
                        .add(layout.createParallelGroup(org.jdesktop.layout.GroupLayout.LEADING)
                            .add(jLabel2)
                            .add(org.jdesktop.layout.GroupLayout.TRAILING, layout.createSequentialGroup()
                                .add(10, 10, 10)
                                .add(srcPathField, org.jdesktop.layout.GroupLayout.DEFAULT_SIZE, 493, Short.MAX_VALUE)
                                .addPreferredGap(org.jdesktop.layout.LayoutStyle.UNRELATED)
                                .add(srcBrowseButton))
                            .add(jLabel4)
                            .add(layout.createSequentialGroup()
                                .add(layout.createParallelGroup(org.jdesktop.layout.GroupLayout.TRAILING)
                                    .add(org.jdesktop.layout.GroupLayout.LEADING, jLabel3)
                                    .add(org.jdesktop.layout.GroupLayout.LEADING, layout.createSequentialGroup()
                                        .add(10, 10, 10)
                                        .add(outputDirField, org.jdesktop.layout.GroupLayout.DEFAULT_SIZE, 493, Short.MAX_VALUE)))
                                .addPreferredGap(org.jdesktop.layout.LayoutStyle.RELATED, 10, org.jdesktop.layout.GroupLayout.PREFERRED_SIZE)
                                .add(outputBrowseButton))))
                    .add(org.jdesktop.layout.GroupLayout.LEADING, layout.createSequentialGroup()
                        .addContainerGap()
                        .add(layout.createParallelGroup(org.jdesktop.layout.GroupLayout.LEADING)
                            .add(layout.createSequentialGroup()
                                .add(10, 10, 10)
                                .add(langSelectBox, 0, 570, Short.MAX_VALUE))
                            .add(jLabel5)))
                    .add(org.jdesktop.layout.GroupLayout.LEADING, layout.createSequentialGroup()
                        .addContainerGap()
                        .add(jLabel1))
                    .add(org.jdesktop.layout.GroupLayout.LEADING, layout.createSequentialGroup()
                        .add(223, 223, 223)
                        .add(beginTransformButton)))
                .addContainerGap())
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(org.jdesktop.layout.GroupLayout.LEADING)
            .add(layout.createSequentialGroup()
                .addContainerGap()
                .add(jLabel1, org.jdesktop.layout.GroupLayout.PREFERRED_SIZE, 17, org.jdesktop.layout.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(org.jdesktop.layout.LayoutStyle.UNRELATED)
                .add(jLabel2)
                .addPreferredGap(org.jdesktop.layout.LayoutStyle.RELATED)
                .add(layout.createParallelGroup(org.jdesktop.layout.GroupLayout.BASELINE)
                    .add(srcBrowseButton)
                    .add(srcPathField, org.jdesktop.layout.GroupLayout.PREFERRED_SIZE, org.jdesktop.layout.GroupLayout.DEFAULT_SIZE, org.jdesktop.layout.GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(org.jdesktop.layout.LayoutStyle.RELATED)
                .add(jLabel3)
                .addPreferredGap(org.jdesktop.layout.LayoutStyle.RELATED)
                .add(layout.createParallelGroup(org.jdesktop.layout.GroupLayout.BASELINE)
                    .add(outputBrowseButton)
                    .add(outputDirField, org.jdesktop.layout.GroupLayout.PREFERRED_SIZE, org.jdesktop.layout.GroupLayout.DEFAULT_SIZE, org.jdesktop.layout.GroupLayout.PREFERRED_SIZE))
                .addPreferredGap(org.jdesktop.layout.LayoutStyle.UNRELATED)
                .add(jLabel4)
                .addPreferredGap(org.jdesktop.layout.LayoutStyle.RELATED)
                .add(transformTypeBox, org.jdesktop.layout.GroupLayout.PREFERRED_SIZE, org.jdesktop.layout.GroupLayout.DEFAULT_SIZE, org.jdesktop.layout.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(org.jdesktop.layout.LayoutStyle.UNRELATED)
                .add(jLabel5)
                .addPreferredGap(org.jdesktop.layout.LayoutStyle.RELATED)
                .add(langSelectBox, org.jdesktop.layout.GroupLayout.PREFERRED_SIZE, org.jdesktop.layout.GroupLayout.DEFAULT_SIZE, org.jdesktop.layout.GroupLayout.PREFERRED_SIZE)
                .add(18, 18, 18)
                .add(beginTransformButton)
                .add(18, 18, 18)
                .add(jScrollPane1, org.jdesktop.layout.GroupLayout.DEFAULT_SIZE, 201, Short.MAX_VALUE)
                .addContainerGap())
        );

        pack();
    }// </editor-fold>//GEN-END:initComponents

    private void srcBrowseButtonActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_srcBrowseButtonActionPerformed
        JFileChooser chooser = new JFileChooser();
        chooser.setDialogTitle("Select the XML file to transform");
        chooser.setFileSelectionMode(JFileChooser.FILES_ONLY);
        chooser.setMultiSelectionEnabled(false);
        int choice = chooser.showDialog(this, "Select file");
        if (choice == JFileChooser.APPROVE_OPTION) {
            File file = chooser.getSelectedFile();
            this.srcFile = file;
            this.srcPathField.setText(file.getPath());
        }
}//GEN-LAST:event_srcBrowseButtonActionPerformed

    private void outputBrowseButtonActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_outputBrowseButtonActionPerformed
        JFileChooser chooser = new JFileChooser();
        chooser.setDialogTitle("Select the output directory for the HTML files");
        chooser.setFileSelectionMode(JFileChooser.DIRECTORIES_ONLY);
        chooser.setMultiSelectionEnabled(false);
        int choice = chooser.showDialog(this, "Select directory");
        if (choice == JFileChooser.APPROVE_OPTION) {
            File file = chooser.getSelectedFile();
            this.outputDir = file;
            this.outputDirField.setText(file.getPath());
        }
}//GEN-LAST:event_outputBrowseButtonActionPerformed

    private void transformTypeBoxActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_transformTypeBoxActionPerformed
        // TODO add your handling code here:
}//GEN-LAST:event_transformTypeBoxActionPerformed

    private void beginTransformButtonActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_beginTransformButtonActionPerformed
        this.logBuffer = "";
        this.transformType = (String)this.transformTypeBox.getSelectedItem();
        this.langCode = (String)this.langSelectBox.getSelectedItem();
        //this.pageBreakPoint = (String)this.pageBreakSelectBox.getSelectedItem();
        try {
            File myDir = new File(".");
            File xsltDir = new File(myDir, "resources");
            // instantiate a new SolBookTransformer and send it the data for the transform
            SolBookTransTypeFactory transSettings = SolBookTransTypeFactory.getInstance();
            SolBookTransType transType = transSettings.getTypeForName(this.transformType);
            SolBookTransformer solbookTransform = null;
            try {
                solbookTransform = SolBookTransformerFactory.getInstance().createSolBookTransformer();
                solbookTransform.setProcessLogger(this);
                solbookTransform.setLangCode(this.langCode);
                solbookTransform.setOutputDir(this.outputDir);
                solbookTransform.setXmlSrcFile(this.srcFile);
                //solbookTransform.setPageBreakPoint(this.pageBreakPoint);
                solbookTransform.setSolBookTransType(transType);
                solbookTransform.setResDir(xsltDir);
                if ( (transType.getCategory().equals(SolBookTransTypeFactory.CATEGORY_XML)) && (transType.getLaunchFileName() == null) ) {
                    transType.setLaunchFileName(srcFile.getName());
                }
                solbookTransform.validateParameters();
            } catch (Exception e) {
                this.feedbackField.append(e.getMessage());
                this.feedbackField.append("ERROR: COULD NOT RUN TRANSFORM");
                return;
            }
            // now run transform as separate SwingWorker thread
            this.feedbackField.setText("  ... starting transform ...");
            solbookTransform.runTransform();
        } catch (Exception e) {
            this.feedbackField.append(e.getMessage());
            this.feedbackField.append("TRANSFORMATION FAILURE");
        }    
}//GEN-LAST:event_beginTransformButtonActionPerformed

    private void langSelectBoxActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_langSelectBoxActionPerformed
        
    }//GEN-LAST:event_langSelectBoxActionPerformed
    
    /**
     * Shows the given text in the feedbackField
     * @param text
     */
    public void addToLog (String text) {
        this.feedbackField.append(text + "\r\n");
    }
    
    public String getLogMsgs () {
        return this.feedbackField.getText();
    }
    
    
    
    
    
    
    
    
    
    /**
     * @param args the command line arguments
     */
    public static void main(String args[]) {
        java.awt.EventQueue.invokeLater(new Runnable() {
            public void run() {
                new SolBookTransGUI().setVisible(true);
            }
        });
    }
    
    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JButton beginTransformButton;
    private javax.swing.JTextArea feedbackField;
    private javax.swing.JLabel jLabel1;
    private javax.swing.JLabel jLabel2;
    private javax.swing.JLabel jLabel3;
    private javax.swing.JLabel jLabel4;
    private javax.swing.JLabel jLabel5;
    private javax.swing.JScrollPane jScrollPane1;
    private javax.swing.JComboBox langSelectBox;
    private javax.swing.JButton outputBrowseButton;
    private javax.swing.JTextField outputDirField;
    private javax.swing.JButton srcBrowseButton;
    private javax.swing.JTextField srcPathField;
    private javax.swing.JComboBox transformTypeBox;
    // End of variables declaration//GEN-END:variables
    
}
