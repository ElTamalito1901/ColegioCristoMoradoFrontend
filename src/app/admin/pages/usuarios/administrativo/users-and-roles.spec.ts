import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsersAndRoles } from './users-and-roles';

describe('UsersAndRoles', () => {
  let component: UsersAndRoles;
  let fixture: ComponentFixture<UsersAndRoles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersAndRoles],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersAndRoles);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
