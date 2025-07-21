import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as XLSX from 'xlsx';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Book } from '../book.component';

@Component({
  selector: 'app-file-upload-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './file-upload-page.component.html',
  styleUrl: './file-upload-page.component.css',
})
export class FileUploadPageComponent implements OnInit {
  public excelData: any[] = [];
  private originalData: any[] = [];
  public isFileUploaded: boolean = false; // Flag to track upload status
  public isEditing: boolean = false;
  public editErrors: { row: number; col: number; message: string }[] = [];

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {}

  // Step 1: Handle file selection
  public onFileSelected(event: any): void {
    const file = event.target.files[0];

    if (!file) {
      alert('No file selected!');
      return;
    }

    // Validate file size (20MB max)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      alert('File size must be under 20MB!');
      return;
    }

    // Validate file extension (Only .csv and .xls)
    const allowedExtensions = ['.csv', '.xlsx'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !allowedExtensions.includes(`.${fileExtension}`)) {
      alert('Invalid file type! Only .csv and .xlsx are allowed.');
      return;
    }

    // Upload file content
    this.uploadFile(file);
  }

  // Step 2: Upload the selected file and process it
  private uploadFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetNames = workbook.SheetNames;
      const sheet = workbook.Sheets[sheetNames[0]];

      // Convert sheet to JSON (array of arrays)
      this.excelData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      this.originalData = JSON.parse(JSON.stringify(this.excelData)); // Deep copy
      this.isFileUploaded = true;
      this.isEditing = false;
      this.editErrors = [];
    };
    reader.readAsBinaryString(file);
  }

  public toggleEdit() {
    if (this.isEditing) {
      // Cancel edit mode - revert to original data
      this.excelData = JSON.parse(JSON.stringify(this.originalData));
      this.editErrors = [];
    } else {
      // Enter edit mode
      this.originalData = JSON.parse(JSON.stringify(this.excelData)); // Save current state
    }
    this.isEditing = !this.isEditing;
  }

  public validateCell(row: number, col: number, value: any): boolean {
    // Basic validation - extend as needed
    const header = this.excelData[0][col].toLowerCase();

    // Remove any existing errors for this cell
    this.editErrors = this.editErrors.filter(
      (error) => !(error.row === row && error.col === col)
    );

    // Add your validation rules here
    if (header.includes('date') && isNaN(Date.parse(value))) {
      this.editErrors.push({
        row,
        col,
        message: 'Invalid date format',
      });
      return false;
    }

    if (header.includes('email') && !value.includes('@')) {
      this.editErrors.push({
        row,
        col,
        message: 'Invalid email format',
      });
      return false;
    }

    return true;
  }

  public onCellChange(row: number, col: number, event: any) {
    const value = event.target.value;
    this.excelData[row][col] = value; // Update the value immediately
    this.validateCell(row, col, value); // Validate in real-time
  }

  public async upsertData() {
    // Validate there are no errors
    if (this.editErrors.length > 0) {
      alert('Please fix all validation errors before upserting');
      return;
    }

    try {
      // Get the data rows (excluding header)
      const dataRows = this.excelData.slice(1);

      // First, fetch existing books from the database
      const existingBooks = await firstValueFrom(
        this.http.get<any[]>('http://localhost:3000/books')
      );

      // Extract existing IDs
      const existingIds = new Set(existingBooks.map((book) => book.id));

      // Prepare the headers
      const headers = this.excelData[0];
      let successfullyAdded = 0;

      // Process each book individually
      for (const row of dataRows) {
        const id = row[0]; // Assuming ID is in the first column

        // Skip if book already exists
        if (existingIds.has(id)) continue;

        // Create book object
        const book: any = {};
        headers.forEach((header: string, index: number) => {
          book[header] = row[index];
        });

        // Post each book individually
        try {
          console.log("Book: ", book);
          await firstValueFrom(
            this.http.post('http://localhost:3000/books', book)
          );
          successfullyAdded++;
        } catch (error) {
          console.error(`Error adding book ${id}:`, error);
        }
      }

      // Show success message
      if (successfullyAdded > 0) {
        alert(
          `Successfully added ${successfullyAdded} new records to the database.`
        );
      } else {
        alert(
          'All records already exist in the database. No new records added.'
        );
      }

      // Update local state
      this.isEditing = false;
      this.originalData = JSON.parse(JSON.stringify(this.excelData));
    } catch (error) {
      console.error('Error during upsert:', error);
      alert(
        'An error occurred while upserting data. Please check the console for details.'
      );
    }
  }

  public getError(row: number, col: number): string | null {
    const error = this.editErrors.find((e) => e.row === row && e.col === col);
    return error ? error.message : null;
  }
}
