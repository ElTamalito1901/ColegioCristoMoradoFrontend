import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Directiva } from './directiva';

describe('Directiva', () => {
  let component: Directiva;
  let fixture: ComponentFixture<Directiva>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Directiva],
    }).compileComponents();

    fixture = TestBed.createComponent(Directiva);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
